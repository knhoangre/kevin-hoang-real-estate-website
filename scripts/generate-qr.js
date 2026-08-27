import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ORIGIN } from './routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * The vCard encoded into the contact QR code.
 *
 * URL comes from ORIGIN rather than being typed here. It used to say
 * `www.kevinhoang.co`, which is not the canonical host — every canonical,
 * og:url, sitemap entry and JSON-LD @id on the site names the apex, and the www
 * host redirects to it. A QR code that hands out the redirecting host is the
 * same class of drift as the footer's call button dialling a different number
 * from the one printed beside it.
 *
 * TEL is the E.164 number for the same reason NAP lives in one config: this is
 * a citation like any other.
 */
const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:Kevin Hoang
TITLE:Real Estate Broker
TEL;TYPE=CELL:+1-860-682-2251
EMAIL:knhoangre@gmail.com
URL:${ORIGIN}
NOTE:Your trusted real estate partner in Boston. Changing Lives Through Technology & Service
END:VCARD`;

// Ensure the images directory exists
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate QR code
QRCode.toFile(
  path.join(imagesDir, 'contact-qr-code.png'),
  vCardData,
  {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 200,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  },
  function (err) {
    if (err) throw err;
    console.log('QR code has been generated successfully!');
  }
);