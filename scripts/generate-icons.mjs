/**
 * Regenerates the favicon set and the Open Graph image into public/.
 *
 * Run manually after changing public/icon.png or public/kevin_hoang.jpg:
 *   node scripts/generate-icons.mjs
 *
 * This is NOT part of `npm run build` — the outputs are committed, and
 * regenerating identical binaries on every deploy just churns git.
 *
 * The OG image draws real text, so it needs a font installed. Alpine has none
 * and silently renders every glyph as a tofu box, so run this on a Debian base
 * with fontconfig present, e.g.
 *   docker run --rm -v "$PWD":/app -w /app node:20-slim bash -c \
 *     'apt-get update -qq && apt-get install -y -qq fontconfig fonts-dejavu-core \
 *      && node scripts/generate-icons.mjs'
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const SRC_ICON = 'public/icon.png';
const SRC_PHOTO = 'public/kevin_hoang.jpg';

// --- Favicons / PWA icons -------------------------------------------------
const sizes = [
  [16, 'public/favicon-16x16.png'],
  [32, 'public/favicon-32x32.png'],
  [180, 'public/apple-touch-icon.png'],
  [192, 'public/icon-192.png'],
  [512, 'public/icon-512.png'],
];

for (const [size, out] of sizes) {
  await sharp(SRC_ICON)
    .resize(size, size, { fit: 'contain', background: { r: 26, g: 26, b: 26, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`icons: wrote ${out} (${size}x${size})`);
}

// --- Open Graph image (1200x630) -----------------------------------------
// Previously this pointed at a lovable.dev placeholder, so every share of the
// site unfurled someone else's branding.
const W = 1200;
const H = 630;
const PHOTO_W = 430;

const photo = await sharp(SRC_PHOTO)
  .resize(PHOTO_W, H, { fit: 'cover', position: 'top' })
  .toBuffer();

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const NAME = 'KEVIN HOANG';
const LINE1 = 'Real Estate Agent';
const LINE2 = 'Needham &amp; Greater Boston, MA';
const LINE3 = 'Keller Williams Realty';

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#1a1a1a"/>
  <rect x="72" y="188" width="64" height="4" fill="#ffffff"/>
  <text x="72" y="150" font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="700" fill="#ffffff" letter-spacing="2">${esc(NAME)}</text>
  <text x="72" y="258" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="500" fill="#e5e5e5">${LINE1}</text>
  <text x="72" y="312" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="500" fill="#e5e5e5">${LINE2}</text>
  <text x="72" y="386" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#9ca3af">${LINE3}</text>
  <text x="72" y="536" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="600" fill="#ffffff">(860) 682-2251</text>
  <text x="72" y="578" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#9ca3af">kevinhoang.co</text>
</svg>`;

await sharp({ create: { width: W, height: H, channels: 3, background: '#1a1a1a' } })
  .composite([
    { input: Buffer.from(svg), top: 0, left: 0 },
    { input: photo, top: 0, left: W - PHOTO_W },
  ])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('public/og-image.jpg');
console.log('icons: wrote public/og-image.jpg (1200x630)');

// --- WebP versions of the large raster assets ----------------------------
for (const [src, out] of [
  [SRC_PHOTO, 'public/kevin_hoang.webp'],
]) {
  await sharp(src).webp({ quality: 78 }).toFile(out);
  console.log(`icons: wrote ${out}`);
}
