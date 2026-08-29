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

// --- Open Graph cards (1200x630) -----------------------------------------
// Previously the site's card pointed at a lovable.dev placeholder, so every
// share unfurled someone else's branding.
//
// Two cards are written, not one. /about used to declare the raw portrait
// public/kevin_hoang.jpg, which is 750x1125 — PORTRAIT — while <Seo> announced
// it as 1200x630. An unfurler that is promised a landscape card and receives a
// tall one falls back to a small thumbnail or drops the image, so /about was
// the one page whose card never rendered. It now gets a real card of its own
// rather than borrowing the site default, because "who is Kevin Hoang" is the
// query that page owns and the card is what a reader sees first.
const W = 1200;
const H = 630;
const PHOTO_W = 430;

const photo = await sharp(SRC_PHOTO)
  .resize(PHOTO_W, H, { fit: 'cover', position: 'top' })
  .toBuffer();

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * The shared card layout: dark ground, photo bleeding off the right edge, name
 * over a rule, up to three body lines, and the NAP footer. Both cards go through
 * here so a change to the treatment cannot land on one and miss the other.
 *
 * `lines` is already HTML-escaped by the caller where it contains an ampersand —
 * SVG text is XML, and a bare `&` is a parse error rather than an ampersand.
 */
const card = async (out, { name, lines }) => {
  // Baselines are literal rather than computed: the third line sits on a wider
  // gap than the second, which a uniform step would quietly flatten.
  const Y = [258, 312, 386];
  const body = lines
    .map(
      (line, i) =>
        `<text x="72" y="${Y[i]}" font-family="Helvetica, Arial, sans-serif" ` +
        `font-size="${i < 2 ? 38 : 28}" font-weight="${i < 2 ? 500 : 400}" ` +
        `fill="${i < 2 ? '#e5e5e5' : '#9ca3af'}">${line}</text>`
    )
    .join('\n  ');

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#1a1a1a"/>
  <rect x="72" y="188" width="64" height="4" fill="#ffffff"/>
  <text x="72" y="150" font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="700" fill="#ffffff" letter-spacing="2">${esc(name)}</text>
  ${body}
  <text x="72" y="536" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="600" fill="#ffffff">(860) 682-2251</text>
  <text x="72" y="578" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#9ca3af">kevinhoang.co</text>
</svg>`;

  await sharp({ create: { width: W, height: H, channels: 3, background: '#1a1a1a' } })
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: photo, top: 0, left: W - PHOTO_W },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  console.log(`icons: wrote ${out} (${W}x${H})`);
};

// Site default, used by every page that does not override ogImage.
await card('public/og-image.jpg', {
  name: 'KEVIN HOANG',
  lines: ['Real Estate Agent', 'Needham &amp; Greater Boston, MA', 'Keller Williams Realty'],
});

// /about. Same treatment, copy pitched at the person rather than the service —
// that page owns the "who is Kevin Hoang" axis and declares the #kevin entity.
await card('public/og-about.jpg', {
  name: 'KEVIN HOANG',
  lines: [
    'Licensed MA Broker since 2021',
    'English &amp; Ti&#7871;ng Vi&#7879;t',
    'Keller Williams Realty · Needham, MA',
  ],
});

// --- WebP versions of the large raster assets ----------------------------
for (const [src, out] of [
  [SRC_PHOTO, 'public/kevin_hoang.webp'],
]) {
  await sharp(src).webp({ quality: 78 }).toFile(out);
  console.log(`icons: wrote ${out}`);
}
