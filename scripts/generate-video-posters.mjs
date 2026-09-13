/**
 * Builds the poster frames for /videos from the screenshots in
 * public/videos/_src/, the way sync-listings.mjs builds public/listings/.
 *
 * WHY THIS EXISTS AT ALL. An Instagram permalink carries no image. The real
 * thumbnail lives on scontent.cdninstagram.com behind a signed URL that expires
 * within days, so hotlinking one gives a page of broken images inside a week,
 * and Meta's oEmbed endpoint needs a reviewed app plus a token that also
 * expires. A committed frame has no failure mode: it is a file.
 *
 * INPUT   public/videos/_src/<id>.(png|jpg|jpeg|webp)   hand-managed, committed
 * OUTPUT  public/videos/<id>.webp      720px wide, the card poster
 *         public/videos/<id>-og.jpg    1200x630, the social card
 *
 * The output is GENERATED — never hand-edit it, and re-run this after adding a
 * reel to src/data/videos.ts. Idempotent: it reuses whatever is already on disk
 * and prunes files no entry references. Not part of `npm run build`, for the
 * same reason sync-listings.mjs is not — the results are committed, so the
 * build stays deterministic and needs no tooling beyond Vite.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC_DIR = 'public/videos/_src';
const OUT_DIR = 'public/videos';
const DATA = 'src/data/videos.ts';

// Reels are 9:16 portrait. The card renders at ~360px in the widest grid
// column, so 720 covers it at 2x DPR — the same reasoning as the 900px listing
// photos, one column narrower.
const POSTER_WIDTH = 720;
const POSTER_QUALITY = 78;

// <Seo> promises exactly this, so the file must actually be this.
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// A centre crop of a 9:16 frame lands on somebody's torso roughly every time.
// The subject of a reel thumbnail is almost always in the upper half.
const OG_POSITION = 'top';

const EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

/**
 * The ids in src/data/videos.ts.
 *
 * Read by regex rather than by importing the module: this is a plain node
 * script with no TypeScript loader, and the alternative — a build step to read
 * a build input — is worse. scripts/routes.mjs pulls slugs out of the data
 * modules the same way. Requires `id: 'x'` or `id: "x"`, which is what the
 * template in videos.ts writes.
 */
const readIds = () => {
  const src = readFileSync(DATA, 'utf8');
  // Comments first, BOTH kinds. The commented-out template in videos.ts is
  // line comments, but the file's own doc block spells out an example
  // permalink and `id:` too — stripping only `//` picked that up and reported
  // a missing screenshot for a video that does not exist.
  const live = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...live.matchAll(/\bid:\s*['"]([A-Za-z0-9_-]+)['"]/g)].map((m) => m[1]);
};

/** The screenshot for an id, whichever extension it was saved with. */
const sourceFor = (id) => {
  for (const ext of EXTS) {
    const p = join(SRC_DIR, id + ext);
    if (existsSync(p)) return p;
  }
  return null;
};

const stats = { built: 0, reused: 0, missing: 0, failed: 0, pruned: 0 };
const kept = new Set();

/**
 * One derivation. Reuses the committed file when it is already there, so a
 * re-run costs nothing and the second run of a pair is a genuine no-op.
 *
 * A failure warns and moves on rather than throwing: one unreadable screenshot
 * must not cost the other nine their posters.
 */
const build = async (file, source, transform) => {
  kept.add(file);
  if (existsSync(file)) {
    stats.reused += 1;
    return true;
  }
  try {
    const out = await transform(sharp(source)).toBuffer();
    writeFileSync(file, out);
    stats.built += 1;
    return true;
  } catch (err) {
    kept.delete(file);
    stats.failed += 1;
    console.warn(`generate-video-posters: could not build ${file} (${err.message})`);
    return false;
  }
};

/** Everything under public/videos/ that no live entry references. */
const prune = () => {
  if (!existsSync(OUT_DIR)) return;
  for (const name of readdirSync(OUT_DIR)) {
    // _src holds the hand-managed originals and is never pruned.
    if (name === '_src') continue;
    const p = join(OUT_DIR, name);
    if (!kept.has(p)) {
      rmSync(p, { recursive: true });
      stats.pruned += 1;
    }
  }
};

const main = async () => {
  const ids = readIds();

  mkdirSync(SRC_DIR, { recursive: true });

  // An empty registry is the state this ships in, and it is legitimate — but
  // it must not be allowed to delete every committed poster on the way past.
  // Same guard as sync-listings.mjs refusing to write an empty snapshot: an
  // empty read is far more often a mistake than a real emptying.
  if (ids.length === 0) {
    console.log(
      'generate-video-posters: no entries in src/data/videos.ts — nothing to build, and nothing pruned.'
    );
    return;
  }

  for (const id of ids) {
    const source = sourceFor(id);
    if (!source) {
      stats.missing += 1;
      console.warn(
        `generate-video-posters: no screenshot for ${id} — save one as ${join(SRC_DIR, id)}${EXTS[0]}`
      );
      continue;
    }

    await build(join(OUT_DIR, `${id}.webp`), source, (img) =>
      img.resize({ width: POSTER_WIDTH, withoutEnlargement: true }).webp({ quality: POSTER_QUALITY })
    );

    await build(join(OUT_DIR, `${id}-og.jpg`), source, (img) =>
      img.resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: OG_POSITION }).jpeg({ quality: 82 })
    );
  }

  prune();

  console.log(
    `generate-video-posters: ${ids.length} video(s) — ${stats.built} built, ${stats.reused} reused, `
      + `${stats.missing} without a screenshot, ${stats.failed} failed, ${stats.pruned} pruned.`
  );

  // A missing screenshot is a half-finished page, not a warning to scroll past.
  if (stats.missing || stats.failed) process.exitCode = 1;
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
