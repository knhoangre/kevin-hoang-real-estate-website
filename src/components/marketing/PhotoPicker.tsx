import { useRef } from 'react';
import { Check, Upload } from 'lucide-react';
import { ADMIN_BUTTON } from '@/components/AdminShell';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UPLOAD_ACCEPT, sourceUrl } from '@/lib/marketingStore';
import type { MarketingDoc, PhotoSource } from '@/lib/marketing';

/**
 * Choose the picture for one frame: any of the listing's photographs, or one of
 * Kevin's own.
 *
 * The listing's photos are shown at card size here — forty originals would be
 * forty megabytes of thumbnails — and the chosen one is fetched at its full
 * size by the page. Uploads are the pictures MLS does not have: his
 * photographer's originals, a floor plan, a brokerage logo.
 *
 * A picture already in another frame is marked, not hidden. Using the same
 * photograph twice is sometimes right (the cover, and again on a sheet).
 */

/** One string per picture, so "is this one already used" is a comparison of two of them. */
const keyOf = (src: PhotoSource): string =>
  src.type === 'mls' ? `mls:${src.mls}:${src.n}` : `${src.type}:${src.path}`;

const sourcesInUse = (doc: MarketingDoc): PhotoSource[] => [
  ...Object.values(doc.photos).flatMap((p) => (p ? [p.src] : [])),
  ...doc.agents.flatMap((a) => [a.photo, a.logo].flatMap((p) => (p ? [p.src] : []))),
];

const Thumb = ({
  src,
  label,
  used,
  onChoose,
}: {
  src: PhotoSource;
  label: string;
  used: boolean;
  onChoose: () => void;
}) => (
  <button
    type="button"
    onClick={onChoose}
    className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 ring-offset-2 transition hover:ring-2 hover:ring-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
  >
    <img
      src={sourceUrl(src, 'card')}
      alt={label}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
    />
    {used && (
      <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-ink-deep/85 px-2 py-0.5 text-[10px] font-semibold text-white">
        <Check className="h-3 w-3" aria-hidden />
        In use
      </span>
    )}
  </button>
);

const PhotoPicker = ({
  open,
  onOpenChange,
  doc,
  frameLabel,
  uploading,
  onChoose,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: MarketingDoc;
  /** Which frame is being filled, for the heading. */
  frameLabel: string;
  uploading: boolean;
  onChoose: (src: PhotoSource) => void;
  /** Upload these and put the first of them in the frame. */
  onUpload: (files: File[]) => void;
}) => {
  const input = useRef<HTMLInputElement>(null);
  const used = new Set(sourcesInUse(doc).map(keyOf));
  const isUsed = (src: PhotoSource) => used.has(keyOf(src));

  const listing: PhotoSource[] = doc.mls
    ? Array.from({ length: doc.photoCount }, (_, n) => ({ type: 'mls', mls: doc.mls, n }))
    : [];
  const uploads: PhotoSource[] = doc.uploads.map((path) => ({ type: 'upload', path }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">Choose a picture</DialogTitle>
          <DialogDescription>
            For: {frameLabel}. Once it is in the frame, drag it to move it and use the zoom slider
            to crop.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-bone p-4">
          <button
            type="button"
            className={ADMIN_BUTTON}
            disabled={uploading}
            onClick={() => input.current?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden />
            {uploading ? 'Uploading…' : 'Upload pictures'}
          </button>
          <p className="min-w-0 flex-1 text-sm text-gray-600">
            Your own photographs, a floor plan or a logo. JPEG, PNG or WebP. Large files are sized
            down to print quality before they are stored.
          </p>
          <input
            ref={input}
            type="file"
            accept={UPLOAD_ACCEPT}
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              // Reset, or choosing the same file twice in a row does nothing.
              event.target.value = '';
              if (files.length > 0) onUpload(files);
            }}
          />
        </div>

        {uploads.length > 0 && (
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Uploaded
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {uploads.map((src, i) => (
                <Thumb
                  key={keyOf(src)}
                  src={src}
                  label={`Uploaded picture ${i + 1}`}
                  used={isUsed(src)}
                  onChoose={() => onChoose(src)}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            From the listing{listing.length > 0 ? ` (${listing.length})` : ''}
          </h3>
          {listing.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {listing.map((src, n) => (
                <Thumb
                  key={n}
                  src={src}
                  label={`Listing photo ${n + 1} of ${listing.length}`}
                  used={isUsed(src)}
                  onChoose={() => onChoose(src)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {doc.mls
                ? 'MLS has no photographs for this listing yet. Upload your own above.'
                : 'No listing chosen. Pick one under Listing to use its photographs, or upload your own above.'}
            </p>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoPicker;
