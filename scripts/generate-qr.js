import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:Kevin Hoang
TITLE:Real Estate Agent
TEL;TYPE=CELL:860-682-2251
EMAIL:knhoangre@gmail.com
URL:www.kevinhoang.co
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