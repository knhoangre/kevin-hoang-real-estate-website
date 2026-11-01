/**
 * Stops the Google Fonts stylesheet holding up the Chinese pages.
 *
 * index.html links it as an ordinary stylesheet, which a browser will not paint
 * past until it has loaded or failed. fonts.googleapis.com is blocked in mainland
 * China, so someone there looking at a /zh page gets a blank window until the
 * request gives up. These pages draw their Chinese with the fonts on the device
 * anyway. English pages keep the blocking link: there it avoids a visible jump
 * from one font to another, and index.html is shared, so this has to happen after
 * the build, on the written files.
 *
 * Part of `npm run build`. scripts/zh-check.mjs asserts the result.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LINK = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/[^"]+)"\s*\/?>/;

const pages = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name === 'index.html' ? [path] : [];
  });

let changed = 0;
for (const file of pages('dist/zh')) {
  const html = readFileSync(file, 'utf8');
  const match = html.match(LINK);
  if (!match) continue;
  writeFileSync(
    file,
    html.replace(
      LINK,
      `<link rel="stylesheet" href="${match[1]}" media="print" onload="this.media='all'">` +
        `<noscript><link rel="stylesheet" href="${match[1]}"></noscript>`
    )
  );
  changed += 1;
}
console.log(`zh-fonts: ${changed} Chinese pages no longer wait on Google Fonts`);
