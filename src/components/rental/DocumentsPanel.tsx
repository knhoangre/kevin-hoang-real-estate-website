/**
 * The document portal: the attachments side of an application.
 *
 * Three things about it are deliberate.
 *
 * Uploads do not depend on the form. The `rental_application_documents` table
 * is separate from `rental_applications`, so the trigger that freezes the
 * answers at submit does not freeze the attachments — someone can send the pay
 * stub they forgot a week later, and someone who filled in an application on
 * another form can upload that PDF and type nothing here at all.
 *
 * Nothing is ever rendered from a public URL. The bucket is private; every
 * View mints a signed URL good for five minutes, on click.
 *
 * It is NOT inside the <form>. A file input that lives inside the application
 * form feeds react-hook-form's watcher and the autosave debounce it drives,
 * and an Enter keypress in the label field would submit the application.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { Section } from '@/components/rental/fields';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_KINDS,
  LABELLED_KINDS,
  deleteDocument,
  documentUrl,
  formatBytes,
  listDocuments,
  setDocumentNote,
  uploadDocument,
  type DocumentKind,
  type RentalDocumentRecord,
} from '@/lib/rentalApplication';

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * The error an upload actually failed with.
 *
 * The count guard in the migration raises a readable message with ERRCODE
 * check_violation, so a rejection there is worth showing verbatim rather than
 * replacing with "something went wrong".
 */
const uploadMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message: unknown }).message);
    if (message) return message;
  }
  return 'That file could not be uploaded. Please try again.';
};

/* ------------------------------------------------------------------ */
/* One attached file                                                   */
/* ------------------------------------------------------------------ */

const DocumentRow = ({
  doc,
  canRemove,
  admin,
  onRemoved,
  onChanged,
}: {
  doc: RentalDocumentRecord;
  canRemove: boolean;
  admin: boolean;
  onRemoved: (id: string) => void;
  onChanged: (doc: RentalDocumentRecord) => void;
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState(doc.adminNote ?? '');

  const open = async () => {
    try {
      // Minted here rather than held in state: a URL fetched when the list
      // loaded would already have expired by the time anyone clicked it.
      const url = await documentUrl(doc);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Could not sign document URL:', err);
      toast({
        variant: 'destructive',
        title: 'Could not open that file',
        description: 'Please try again in a moment.',
      });
    }
  };

  /**
   * Deleting is the one irreversible thing on this panel — the row goes AND the
   * object goes with it, so a mis-click on a tax return costs the applicant a
   * trip back to their bureau. This was `window.confirm`, which browsers style
   * as an OS alert, suppress outright after a couple of dialogs from the same
   * page, and which cannot say which file it means in the same voice as the
   * page around it. A real dialog is also focus-trapped, so Escape cancels and
   * Return does not land on the destructive action by accident.
   */
  const remove = async () => {
    if (busy) return;
    setConfirming(false);
    setBusy(true);
    try {
      await deleteDocument(doc);
      onRemoved(doc.id);
      toast({ title: 'File removed', description: doc.fileName });
    } catch (err) {
      console.error('Could not delete document:', err);
      toast({
        variant: 'destructive',
        title: 'Could not remove that file',
        description: 'Please try again in a moment.',
      });
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async (needsReplacement: boolean) => {
    setBusy(true);
    try {
      await setDocumentNote(doc.id, { adminNote: note, needsReplacement });
      onChanged({ ...doc, adminNote: note || null, needsReplacement });
      toast({ title: 'Saved' });
    } catch (err) {
      console.error('Could not save document note:', err);
      toast({ variant: 'destructive', title: 'Could not save that note' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-champagne-ink" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{doc.fileName}</p>
          {/* Size and date: `numeral` keeps the figures one width so a column of
              files does not stagger. */}
          <p className="numeral mt-0.5 text-xs text-gray-500">
            {formatBytes(doc.sizeBytes)} · added {shortDate(doc.createdAt)}
            {doc.label ? ` · ${doc.label}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={open}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-champagne hover:text-champagne-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            View
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy}
              aria-label={`Remove ${doc.fileName}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              )}
              Remove
            </button>
          )}
        </div>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this file?</AlertDialogTitle>
            {/* The filename and the size, because "are you sure?" over a list of
                similarly named PDFs tells the reader nothing about which one
                they are about to lose. */}
            <AlertDialogDescription>
              <span className="numeral font-semibold text-ink">{doc.fileName}</span> (
              {formatBytes(doc.sizeBytes)}) will be deleted permanently. This cannot be
              undone — the file would have to be uploaded again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              Remove file
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Amber, not champagne: this is a signal the applicant has to act on. */}
      {doc.needsReplacement && (
        <p className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">Please replace this file.</strong>
            {doc.adminNote ? ` ${doc.adminNote}` : ''}
          </span>
        </p>
      )}
      {!doc.needsReplacement && doc.adminNote && !admin && (
        <p className="mt-2 text-xs text-gray-600">Note from Kevin: {doc.adminNote}</p>
      )}

      {admin && (
        <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note to the applicant about this file"
            className="h-9 flex-1 text-sm"
            maxLength={300}
          />
          <button
            type="button"
            onClick={() => saveNote(true)}
            disabled={busy}
            className="rounded-full border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-50 disabled:opacity-60"
          >
            Ask to replace
          </button>
          <button
            type="button"
            onClick={() => saveNote(false)}
            disabled={busy}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-champagne disabled:opacity-60"
          >
            {doc.needsReplacement ? 'Clear flag' : 'Save note'}
          </button>
        </div>
      )}
    </li>
  );
};

/* ------------------------------------------------------------------ */
/* One category                                                        */
/* ------------------------------------------------------------------ */

const KindBlock = ({
  applicationId,
  kind,
  title,
  blurb,
  steps,
  docs,
  canUpload,
  admin,
  onUploaded,
  onRemoved,
  onChanged,
}: {
  applicationId: string;
  kind: DocumentKind;
  title: string;
  blurb: string;
  steps?: { title: string; items: string[] };
  docs: RentalDocumentRecord[];
  canUpload: boolean;
  admin: boolean;
  onUploaded: (doc: RentalDocumentRecord) => void;
  onRemoved: (id: string) => void;
  onChanged: (doc: RentalDocumentRecord) => void;
}) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  const wantsLabel = LABELLED_KINDS.includes(kind);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Cleared immediately so picking the same file twice still fires a change.
    e.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    let failed = 0;
    for (const file of files) {
      try {
        onUploaded(await uploadDocument(applicationId, kind, file, label));
      } catch (err) {
        console.error('Document upload failed:', err);
        failed += 1;
        setError(uploadMessage(err));
      }
    }
    setUploading(false);
    setLabel('');
    if (failed === 0) {
      toast({
        title: files.length === 1 ? 'File added' : `${files.length} files added`,
        description: 'Kevin can see it now.',
      });
    }
  };

  return (
    <div className="border-t border-gray-100 pt-5 first:border-0 first:pt-0">
      {/* No "Required" badge and no alarm over an empty section, even for the
          kind that blocks a submit. A form that labels its own sections as
          demands reads as a gate rather than a request, and the applicant is
          being asked for their financial records by somebody they have not met
          yet. The blurb asks plainly, the steps say how, and the one place the
          requirement is stated is next to the button it affects. */}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{blurb}</p>

      {/* The click path, open on the page rather than folded away: this is the
          document people come back with questions about, and an accordion would
          hide the answer behind exactly the step they are stuck on. */}
      {steps && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-bone px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-600">
            {steps.title}
          </p>
          <ol className="numeral mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-gray-700 marker:font-semibold marker:text-champagne-ink">
            {steps.items.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {docs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {docs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              canRemove={canUpload || admin}
              admin={admin}
              onRemoved={onRemoved}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}

      {canUpload && (
        <div className="mt-3 print:hidden">
          {wantsLabel && (
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="What is it? (optional)"
              className="mb-2 h-9 max-w-sm text-sm"
              maxLength={120}
            />
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={DOCUMENT_ACCEPT}
            onChange={onPick}
            className="sr-only"
            aria-label={`Add a file under ${title}`}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-champagne hover:text-champagne-ink disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Paperclip className="h-4 w-4" aria-hidden />
            )}
            {docs.length > 0 ? 'Add another file' : 'Add a file'}
          </button>
          {error && (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {!canUpload && docs.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">Nothing attached.</p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* The panel                                                           */
/* ------------------------------------------------------------------ */

export default function DocumentsPanel({
  applicationId,
  canUpload = true,
  admin = false,
  delay = 0,
  onDocsChange,
}: {
  applicationId: string;
  /** False renders the list read-only. Uploads stay open after submit by default. */
  canUpload?: boolean;
  /** Admin view: the per-file note and replace-request controls. */
  admin?: boolean;
  delay?: number;
  /**
   * The current list, whenever it changes. The form above needs it to know
   * whether the required kinds are attached — this panel owns the list, and
   * lifting it into the form would mean every page mounting the panel also
   * fetching and threading it.
   */
  onDocsChange?: (docs: RentalDocumentRecord[]) => void;
}) {
  const [docs, setDocs] = useState<RentalDocumentRecord[] | null>(null);
  const [failed, setFailed] = useState(false);

  // A ref, not a dependency: an unmemoised callback in the dependency array
  // would re-run this on every parent render, and the parent re-renders on
  // every keystroke of the form above.
  const notify = useRef(onDocsChange);
  notify.current = onDocsChange;
  useEffect(() => {
    if (docs) notify.current?.(docs);
  }, [docs]);

  const load = useCallback(async () => {
    try {
      setDocs(await listDocuments(applicationId));
      setFailed(false);
    } catch (err) {
      console.error('Could not load documents:', err);
      setFailed(true);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const byKind = useMemo(() => {
    const map = new Map<DocumentKind, RentalDocumentRecord[]>();
    for (const doc of docs ?? []) {
      const list = map.get(doc.kind);
      if (list) list.push(doc);
      else map.set(doc.kind, [doc]);
    }
    return map;
  }, [docs]);

  const total = docs?.length ?? 0;
  const flagged = (docs ?? []).filter((d) => d.needsReplacement).length;

  return (
    <Section
      id="documents"
      title="Documents"
      blurb={
        canUpload
          ? 'Upload what you have. You can add more at any time, including after you submit — and you can send documents even if you have not filled in the form.'
          : 'Everything attached to this application.'
      }
      delay={delay}
    >
      {docs === null ? (
        <div className="flex min-h-[8rem] items-center justify-center">
          {failed ? (
            <p className="text-sm text-red-700">
              Could not load your documents. Please reload the page.
            </p>
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-champagne-ink" aria-hidden />
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {flagged > 0 && !admin && (
            <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                {flagged === 1
                  ? 'One file needs to be replaced. It is marked below.'
                  : `${flagged} files need to be replaced. They are marked below.`}
              </span>
            </p>
          )}

          {DOCUMENT_KINDS.map((k) => (
            <KindBlock
              key={k.id}
              applicationId={applicationId}
              kind={k.id}
              title={k.title}
              blurb={k.blurb}
              steps={k.steps}
              docs={byKind.get(k.id) ?? []}
              canUpload={canUpload}
              admin={admin}
              onUploaded={(doc) => setDocs((prev) => [...(prev ?? []), doc])}
              onRemoved={(id) => setDocs((prev) => (prev ?? []).filter((d) => d.id !== id))}
              onChanged={(next) =>
                setDocs((prev) => (prev ?? []).map((d) => (d.id === next.id ? next : d)))
              }
            />
          ))}

          {canUpload && (
            <p className="text-xs text-gray-500">
              PDFs and photos, up to 15 MB each. {total > 0 ? `${total} attached so far. ` : ''}
              Please black out any bank account or Social Security numbers — neither is needed,
              and nothing on this site asks for them.
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
