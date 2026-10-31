/**
 * Kevin's signature, as HTML that mail clients will render.
 *
 * Tables and inline styles, because that is all a mail client can be trusted
 * with. Nothing in it depends on the picture: with images blocked, which is many
 * mail clients' default, the name, the number and the links all still read.
 *
 * LPT REALTY IS IN IT BECAUSE IT HAS TO BE: 254 CMR 3.00 wants the brokerage on
 * what goes out under a broker's name. Name and phone come from AGENT, which
 * mirrors SITE character for character (NAP). Champagne #c5a572 is only ever the
 * rule, a non-text mark; the line of words uses champagne-ink #8c6b35, which is
 * what passes on white.
 *
 * THE PHOTO'S ADDRESS MUST NEVER CHANGE. A sent email goes on asking for it for
 * as long as it sits in somebody's inbox. To change the picture, replace the file
 * at public/email/kevin-hoang.jpg and keep its name. It is 240 pixels square,
 * drawn at 88: the extra is what keeps a face sharp on a phone's screen.
 */
import { SITE_ORIGIN, escapeHtml } from './listingEmail.ts';
import { AGENT } from './showingReminders.ts';

export const SIGNATURE_PHOTO = `${SITE_ORIGIN}/email/kevin-hoang.jpg`;

/** A deliberate mirror of the two entries in SITE.profiles. */
const LINKS = [
  { name: 'Google', url: 'https://share.google/dBpe3OLBDeYHfZq28' },
  { name: 'Facebook', url: 'https://www.facebook.com/knhoangre/' },
];

/**
 * For the email's <head>. On the narrowest phones the photo at full size is what
 * would push the whole email eight pixels wider than the screen.
 */
export const SIGNATURE_STYLE =
  '@media only screen and (max-width:360px){.sig-photo,.sig-photo-cell{width:72px !important;}.sig-photo{height:72px !important;}}';

const SANS = 'Inter,Arial,Helvetica,sans-serif';
const LINE = `font-family:${SANS};font-size:13px;line-height:21px;color:#1a1a1a;`;
const LINK = 'color:#1a1a1a;text-decoration:none;';

export const signatureHtml = (): string => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr>
    <td class="sig-photo-cell" width="88" valign="middle" style="width:88px;padding:0 16px 0 0;">
      <a href="${SITE_ORIGIN}"><img src="${SIGNATURE_PHOTO}" width="88" height="88" alt="${escapeHtml(AGENT.name)}" class="sig-photo" style="display:block;width:88px;height:88px;border:0;border-radius:50%;" /></a>
    </td>
    <td width="1" bgcolor="#c5a572" style="width:1px;background-color:#c5a572;font-size:0;line-height:0;">&nbsp;</td>
    <td valign="middle" style="padding:0 0 0 16px;">
      <div style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:21px;line-height:26px;color:#1a1a1a;">${escapeHtml(AGENT.name)}</div>
      <div style="padding:2px 0 9px 0;font-family:${SANS};font-size:10px;line-height:15px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#8c6b35;">Realtor&reg; &nbsp;&middot;&nbsp; ${escapeHtml(AGENT.brokerage)}</div>
      <div style="${LINE}"><a href="tel:+18606822251" style="${LINK}">${escapeHtml(AGENT.phone)}</a></div>
      <div style="${LINE}"><a href="mailto:${escapeHtml(AGENT.email)}" style="${LINK}">${escapeHtml(AGENT.email)}</a></div>
      <div style="${LINE}"><a href="${SITE_ORIGIN}" style="${LINK}">kevinhoang.co</a></div>
      <div style="padding:6px 0 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:#8c6b35;">${LINKS.map(
        (l) => `<a href="${escapeHtml(l.url)}" style="color:#8c6b35;text-decoration:underline;">${escapeHtml(l.name)}</a>`
      ).join('&nbsp;&nbsp;&middot;&nbsp;&nbsp;')}</div>
    </td>
  </tr>
</table>`;

/** The same, for an email's plain-text part. */
export const signatureText = (): string =>
  [AGENT.name, `Realtor®, ${AGENT.brokerage}`, AGENT.phone, AGENT.email, 'kevinhoang.co'].join('\n');
