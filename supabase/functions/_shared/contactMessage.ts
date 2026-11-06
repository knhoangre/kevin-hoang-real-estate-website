/**
 * The email a contact form sends Kevin (and Maggie Li, from the Chinese pages).
 *
 * Pure, so `node scripts/contact-email-check.ts` renders it. The function in
 * submit-contact/ files the person and sends it.
 *
 * The same layout as the home valuation request (valuationRequest.ts): a white
 * card on grey, an eyebrow saying which page it came from, the person's name as
 * the heading, a table of how to reach them, then the message. Tables and inline
 * styles only. The old one was a <style> block, flexbox and emoji buttons, which
 * Gmail and Outlook drop, and it ran a message's lines together.
 *
 * Everything here was typed by a stranger, so every value is escaped where it is
 * placed.
 */
import { SITE_ORIGIN, escapeHtml } from './listingEmail.ts';

export interface ContactMessage {
  firstName: string;
  lastName: string;
  email: string;
  /** As stored: XXX-XXX-XXXX when it had ten digits, otherwise as typed. */
  phone: string;
  message: string;
  /** The page the form was on, or '' when the request named none we accept. */
  page: string;
  /** The Chinese form, which goes to Maggie Li as well. */
  zh: boolean;
}

/**
 * The path the browser said it was on. Only a plain path is kept: it becomes a
 * link to this site, and nothing else may be made into one.
 */
export const pagePath = (value: unknown): string =>
  typeof value === 'string' && value.length <= 300 && /^\/[A-Za-z0-9\-._~%/]*$/.test(value) ? value : '';

/** Ten digits for a tel: link, or '' when there are not ten. */
const tenDigits = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  return ten.length === 10 ? ten : '';
};

/** A subject is one header line, and every word of it came from the form. */
const oneLine = (value: string) => value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

const fullName = (m: ContactMessage) => `${m.firstName} ${m.lastName}`.trim();

export const subjectFor = (m: ContactMessage): string => {
  const name = oneLine(fullName(m)).slice(0, 120);
  if (m.zh) return `Chinese pages: message from ${name}`;
  if (m.page.startsWith('/search/')) return `Question about a listing from ${name}`;
  return `Website message from ${name}`;
};

const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";

const row = (label: string, text: string, href?: string) =>
  text
    ? `<tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1a1a1a;font-size:15px;word-break:break-word;">${
        href
          ? `<a href="${escapeHtml(href)}" style="color:#1a1a1a;text-decoration:underline;text-decoration-color:#c5a572;">${escapeHtml(text)}</a>`
          : escapeHtml(text)
      }</td></tr>`
    : '';

/** The site's pill, in the two tones that read on white. */
const button = (href: string, label: string, filled: boolean) =>
  `<td style="padding:0 8px 8px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 22px;border-radius:999px;font-family:${SANS};font-size:14px;font-weight:600;text-decoration:none;white-space:nowrap;${
    filled ? 'background:#c5a572;color:#0d0d0f;border:1px solid #c5a572;' : 'background:#ffffff;color:#1a1a1a;border:1px solid #1a1a1a;'
  }">${escapeHtml(label)}</a></td>`;

const page = (body: string) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:${SANS};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;"><tr><td style="padding:28px;">${body}</td></tr></table>
</td></tr></table></body></html>`;

export const contactEmail = (m: ContactMessage) => {
  const name = fullName(m);
  const tel = tenDigits(m.phone);
  const where = m.page ? `kevinhoang.co${m.page}` : 'kevinhoang.co';
  const eyebrow = m.zh ? `From the Chinese pages · ${where}` : `From ${where}`;
  const replyHref = `mailto:${m.email}?subject=${encodeURIComponent('Re: your message on kevinhoang.co')}`;

  const buttons = [
    button(replyHref, 'Reply', true),
    tel ? button(`tel:+1${tel}`, 'Call', false) : '',
    tel ? button(`sms:+1${tel}`, 'Text', false) : '',
  ].join('');

  const footer = m.zh
    ? `Sent to Maggie Li and Kevin. ${escapeHtml(m.firstName)} is filed in the CRM with the source &ldquo;Website - Chinese (Maggie Li)&rdquo;. Replying to this email reaches them.`
    : `${escapeHtml(m.firstName)} is filed in the CRM with the source &ldquo;Website&rdquo;. Replying to this email reaches them.`;

  return {
    subject: subjectFor(m),
    html: page(
      `<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8c6b35;">${escapeHtml(eyebrow)}</p>
<h1 style="margin:0 0 20px;font-size:22px;color:#1a1a1a;">${escapeHtml(name)}</h1>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">${row('Email', m.email, `mailto:${m.email}`)}${row(
        'Phone',
        m.phone,
        tel ? `tel:+1${tel}` : undefined
      )}${row('Sent from', m.page ? where : '', m.page ? `${SITE_ORIGIN}${m.page}` : undefined)}</table>
<div style="margin:20px 0 24px;padding:18px 20px;background:#faf8f5;border-left:3px solid #c5a572;border-radius:4px;font-size:15px;line-height:1.6;color:#1a1a1a;">${escapeHtml(
        m.message
      ).replace(/\r?\n/g, '<br>')}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${buttons}</tr></table>
<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#666;">${footer}</p>`
    ),
    text: [
      m.zh ? 'Message from the Chinese pages on kevinhoang.co' : 'Message from kevinhoang.co',
      '',
      `Name: ${name}`,
      `Email: ${m.email}`,
      m.phone ? `Phone: ${m.phone}` : null,
      m.page ? `Sent from: ${SITE_ORIGIN}${m.page}` : null,
      '',
      m.message,
    ]
      .filter((line) => line !== null)
      .join('\n'),
  };
};
