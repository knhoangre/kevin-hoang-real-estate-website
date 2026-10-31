/**
 * Kevin's signature, as HTML that mail clients will render.
 *
 * His own layout, tidied, chosen from four on 2026-10-31: a square photo with
 * Google and Facebook under it, then his name, a small line of words, and his
 * contact details each beside a small icon.
 *
 * Tables and inline styles, because that is all a mail client can be trusted
 * with. His contact details are text and the icons beside them are decoration, so
 * with images blocked, which is many mail clients' default, they all still read.
 * Google and Facebook fall back on their alt text, which is sized on the image
 * because the row around it is font-size 0.
 *
 * LPT REALTY IS IN IT BECAUSE IT HAS TO BE: 254 CMR 3.00 wants the brokerage on
 * what goes out under a broker's name. Name and phone come from AGENT, which
 * mirrors SITE character for character (NAP). The icons and the small line are
 * champagne-ink #8c6b35, which is what passes on white.
 *
 * THE ADDRESSES IN public/email/ MUST NEVER CHANGE. A sent email goes on asking
 * for them for as long as it sits in somebody's inbox. To change a picture, replace
 * the file and keep its name.
 */
import { SITE_ORIGIN, escapeHtml } from './listingEmail.ts';
import { AGENT } from './showingReminders.ts';

const IMAGES = `${SITE_ORIGIN}/email`;

export const SIGNATURE_PHOTO = `${IMAGES}/kevin-hoang.jpg`;

/**
 * For the email's <head>. Under 360 pixels the photo at full size is what would
 * push the whole email wider than the screen: the column beside it cannot wrap.
 */
export const SIGNATURE_STYLE =
  '@media only screen and (max-width:359px){.sig-photo,.sig-photo-cell{width:72px !important;}.sig-photo{height:72px !important;}.sig-photo-cell{padding-right:12px !important;}}';

const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";

const row = (icon: string, href: string, text: string): string =>
  `<tr>
          <td width="22" valign="middle" style="width:22px;min-width:22px;padding:3px 0;font-size:0;line-height:0;"><img src="${IMAGES}/icon-${icon}.png" width="14" height="14" alt="" style="display:block;width:14px;height:14px;border:0;" /></td>
          <td valign="middle" style="padding:3px 0;font-family:${SANS};font-size:13px;line-height:18px;color:#1a1a1a;white-space:nowrap;"><a href="${escapeHtml(href)}" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(text)}</a></td>
        </tr>`;

/** A deliberate mirror of the two entries in SITE.profiles. */
const profile = (image: string, name: string, url: string, gap: boolean): string =>
  `<a href="${escapeHtml(url)}" style="color:#1a1a1a;"><img src="${IMAGES}/${image}.png" width="22" height="22" alt="${name}" style="display:inline-block;width:22px;height:22px;border:0;font-family:${SANS};font-size:11px;line-height:14px;${gap ? 'margin-right:7px;' : ''}" /></a>`;

export const signatureHtml = (): string => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr>
    <td class="sig-photo-cell" width="112" valign="top" style="width:112px;padding:0 16px 0 0;">
      <a href="${SITE_ORIGIN}"><img class="sig-photo" src="${SIGNATURE_PHOTO}" width="112" height="112" alt="${escapeHtml(AGENT.name)}" style="display:block;width:112px;height:112px;border:0;border-radius:8px;" /></a>
      <div style="padding:9px 0 0 0;font-size:0;line-height:0;">${profile('google', 'Google', 'https://share.google/dBpe3OLBDeYHfZq28', true)}${profile('facebook', 'Facebook', 'https://www.facebook.com/knhoangre/', false)}</div>
    </td>
    <td valign="top">
      <div style="font-family:${SANS};font-size:16px;line-height:22px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;color:#1a1a1a;">${escapeHtml(AGENT.name)}</div>
      <div style="padding:2px 0 9px 0;font-family:${SANS};font-size:10px;line-height:16px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;white-space:nowrap;color:#8c6b35;">Realtor&reg; &middot; ${escapeHtml(AGENT.brokerage)}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        ${row('phone', 'tel:+18606822251', AGENT.phone)}
        ${row('mail', `mailto:${AGENT.email}`, AGENT.email)}
        ${row('globe', SITE_ORIGIN, 'kevinhoang.co')}
      </table>
    </td>
  </tr>
</table>`;

/** The same, for an email's plain-text part. */
export const signatureText = (): string =>
  [AGENT.name, `Realtor®, ${AGENT.brokerage}`, AGENT.phone, AGENT.email, 'kevinhoang.co'].join('\n');
