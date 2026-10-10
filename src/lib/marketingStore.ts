/**
 * Marketing documents — reading, saving and uploading.
 *
 * Everything that touches Supabase, and nothing that decides anything: what a
 * document IS, what MLS fills in, how a picture is cropped and where a list
 * breaks are all in marketing.ts, which is pure and has its own check. The same
 * split as idxComps.ts and valuation.ts.
 *
 * The table and the bucket are the admin's alone (see the migration); every
 * call here simply fails for anyone else.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { photoUrl } from '@/lib/idxSearch';
import { SITE } from '@/lib/siteConfig';
import {
  blankAgent,
  blankDoc,
  docTitle,
  hydrateDoc,
  type Agent,
  type DocKind,
  type MarketingDoc,
  type PhotoSource,
} from '@/lib/marketing';

const BUCKET = 'marketing-images';
const KINDS: DocKind[] = ['booklet', 'expenses', 'upgrades'];

const kindOf = (value: string): DocKind => (KINDS.includes(value as DocKind) ? (value as DocKind) : 'booklet');

/**
 * Kevin, as a new document starts with him — read from SITE, so the phone and
 * the brokerage on a booklet are the ones on the site, character for character.
 * The headshot is the file the site already serves; `y` favours the top of it,
 * where the face is in a portrait.
 */
export const siteAgent = (): Agent => ({
  ...blankAgent(),
  name: SITE.agentName,
  phone: SITE.phone,
  email: SITE.email,
  web: new URL(SITE.origin).host,
  brokerage: SITE.brokerage,
  photo: { src: { type: 'site', path: '/kevin_hoang.webp' }, x: 0.5, y: 0.08, zoom: 1 },
});

export interface DocSummary {
  id: string;
  kind: DocKind;
  design: string;
  title: string;
  mls: string | null;
  updatedAt: string;
}

export interface StoredDoc {
  id: string;
  doc: MarketingDoc;
}

/** Every document, most recently touched first. */
export const listDocs = async (): Promise<DocSummary[]> => {
  const { data, error } = await supabase
    .from('marketing_documents')
    .select('id, kind, design, title, mls_number, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: kindOf(row.kind),
    design: row.design,
    title: row.title,
    mls: row.mls_number,
    updatedAt: row.updated_at,
  }));
};

export const loadDoc = async (id: string): Promise<StoredDoc | null> => {
  const { data, error } = await supabase
    .from('marketing_documents')
    .select('id, kind, doc')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const kind = kindOf(data.kind);
  // The row's `kind` wins over whatever the jsonb says: it is the checked column.
  return { id: data.id, doc: { ...hydrateDoc(data.doc, kind, siteAgent()), kind } };
};

/** The columns beside `doc` are copies, written here so the list need not open every document. */
const columnsOf = (doc: MarketingDoc) => ({
  kind: doc.kind,
  design: doc.design,
  title: docTitle(doc),
  mls_number: doc.mls || null,
  // The compiler cannot see that a MarketingDoc is JSON; it is, by construction.
  doc: doc as unknown as Json,
});

export const createDoc = async (doc: MarketingDoc): Promise<string> => {
  const { data, error } = await supabase
    .from('marketing_documents')
    .insert(columnsOf(doc))
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

export const saveDoc = async (id: string, doc: MarketingDoc): Promise<void> => {
  const { error } = await supabase.from('marketing_documents').update(columnsOf(doc)).eq('id', id);
  if (error) throw error;
};

/**
 * A new document of a kind, starting with whoever was on the last one.
 *
 * A co-listing agent typed once should not have to be typed again for the
 * expense sheet of the same house, so the agents are carried over from the most
 * recently touched document. With none yet, it is Kevin alone.
 */
export const startDoc = async (kind: DocKind, latestId: string | null): Promise<string> => {
  const doc = blankDoc(kind, siteAgent());
  if (latestId) {
    try {
      const latest = await loadDoc(latestId);
      if (latest && latest.doc.agents.length > 0) doc.agents = latest.doc.agents;
    } catch {
      // Carrying the agents over is a convenience; a new document does not wait on it.
    }
  }
  return createDoc(doc);
};

/** A second copy, to change. It shares the original's uploaded pictures — see deleteDoc. */
export const duplicateDoc = async (id: string): Promise<string> => {
  const original = await loadDoc(id);
  if (!original) throw new Error('That document no longer exists.');
  return createDoc(original.doc);
};

/**
 * Delete a document and the pictures uploaded for it.
 *
 * A duplicate lists the same uploads as the document it was copied from, so a
 * picture is removed only when NO OTHER document still lists it. Deleting the
 * copy must not blank the frames in the original.
 *
 * The row goes first. If removing the files then fails, what is left is a few
 * unreferenced pictures in the bucket; the other order can leave a document
 * whose pictures are gone.
 */
export const deleteDoc = async (id: string): Promise<void> => {
  const doomed = await loadDoc(id);

  const { error } = await supabase.from('marketing_documents').delete().eq('id', id);
  if (error) throw error;

  const paths = doomed?.doc.uploads ?? [];
  if (paths.length === 0) return;
  try {
    const { data } = await supabase.from('marketing_documents').select('doc');
    const stillUsed = new Set<string>();
    for (const row of data ?? []) {
      const uploads = (row.doc as { uploads?: unknown } | null)?.uploads;
      if (Array.isArray(uploads)) uploads.forEach((p) => typeof p === 'string' && stillUsed.add(p));
    }
    const orphaned = paths.filter((p) => !stillUsed.has(p));
    if (orphaned.length > 0) await supabase.storage.from(BUCKET).remove(orphaned);
  } catch (err) {
    console.warn('Could not remove uploaded pictures:', err);
  }
};

/* -------------------------------------------------------------------------- */
/* Pictures                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The address of a picture, for an <img>.
 *
 * `print` asks MLS PIN for the original — the largest it has. `card` is for the
 * picker's grid, where forty originals would be forty megabytes of thumbnails.
 * An upload has one size; a `site` picture is made absolute because the
 * document is drawn inside a frame, and what "/x.webp" is relative to in there
 * is not worth depending on.
 */
export const sourceUrl = (src: PhotoSource, size: 'print' | 'card' = 'print'): string => {
  if (src.type === 'mls') return photoUrl(src.mls, src.n, size);
  if (src.type === 'upload') return supabase.storage.from(BUCKET).getPublicUrl(src.path).data.publicUrl;
  return new URL(src.path, window.location.origin).toString();
};

/** Long edge, in pixels. A full letter page at 218 dpi; a cover panel at 430. */
const MAX_EDGE = 2400;
/** A PNG is kept as a PNG — a floor plan's lines stay sharp — unless it is a photograph in disguise. */
const MAX_PNG_BYTES = 2_500_000;

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/** What the file input offers. HEIC is absent on purpose: Chrome cannot decode it. */
export const UPLOAD_ACCEPT = ACCEPTED.join(',');

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * A picture, made ready to store: no larger than MAX_EDGE on its long side.
 *
 * A camera original is 8–12 MB and 6000px wide, which is three times what any
 * frame here can print and would fill the free gigabyte of storage in about a
 * hundred pictures. These are Kevin's OWN files, read from his disk, so unlike
 * an MLS photo they can be drawn to a canvas and re-encoded.
 */
const prepare = async (file: File): Promise<{ blob: Blob; type: string; ext: string }> => {
  if (!ACCEPTED.includes(file.type)) {
    const heic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    throw new Error(
      heic
        ? `"${file.name}" is an iPhone HEIC photo, which this browser cannot read. Export it as a JPEG and add that.`
        : `"${file.name}" is not a picture this can use. Add a JPEG, PNG or WebP.`
    );
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`"${file.name}" could not be opened as a picture.`);
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const png = file.type === 'image/png';

  // Small enough already: store the file as it is rather than re-encoding it.
  if (scale === 1 && file.size <= (png ? MAX_PNG_BYTES : 1_500_000)) {
    bitmap.close();
    return { blob: file, type: file.type, ext: png ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg' };
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not resize the picture.');
  if (!png) {
    // JPEG has no transparency; anything see-through would otherwise go black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  if (png) {
    const asPng = await toBlob(canvas, 'image/png');
    if (asPng && asPng.size <= MAX_PNG_BYTES) return { blob: asPng, type: 'image/png', ext: 'png' };
    // Too heavy to be line art. White behind it, then as a JPEG.
    const flat = document.createElement('canvas');
    flat.width = canvas.width;
    flat.height = canvas.height;
    const flatCtx = flat.getContext('2d');
    if (flatCtx) {
      flatCtx.fillStyle = '#ffffff';
      flatCtx.fillRect(0, 0, flat.width, flat.height);
      flatCtx.drawImage(canvas, 0, 0);
      const asJpeg = await toBlob(flat, 'image/jpeg', 0.9);
      if (asJpeg) return { blob: asJpeg, type: 'image/jpeg', ext: 'jpg' };
    }
  }
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.9);
  if (!jpeg) throw new Error('This browser could not resize the picture.');
  return { blob: jpeg, type: 'image/jpeg', ext: 'jpg' };
};

/**
 * Upload one picture for a document and return its path in the bucket.
 *
 * `<document id>/<uuid>.<ext>` — never the original filename, which can be
 * anything. `cacheControl` is a year: the name is a fresh uuid and the object
 * is never rewritten, and without it Supabase stores `no-cache` and bills the
 * transfer on every view (the lesson of the listing photos on /properties).
 */
export const uploadImage = async (docId: string, file: File): Promise<string> => {
  const { blob, type, ext } = await prepare(file);
  const path = `${docId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { cacheControl: '31536000', upsert: false, contentType: type });
  if (error) throw new Error(error.message || 'The picture could not be uploaded.');
  return path;
};
