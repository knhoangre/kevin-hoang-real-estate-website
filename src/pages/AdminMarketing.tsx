/**
 * /admin/marketing — the booklets and sheets Kevin hands out for a listing.
 *
 * Three documents, made here instead of by hand in a slide program:
 *
 *   Booklet         a folded listing booklet. Type an address or an MLS number
 *                   and it fills in — the address, the price, the facts, the
 *                   description, the photographs.
 *   Home expenses   what the home costs to run, line by line.
 *   Home upgrades   what has been done to it, and when.
 *
 * This page is the LIST of them and the three ways to start one. An open
 * document is `?doc=<id>` on this same route rather than /admin/marketing/:id —
 * a path segment that cannot be known at build time would need a third rewrite
 * in vercel.json, and every one of those moves the site back toward answering
 * 200 for URLs that do not exist.
 *
 * Admin only. AdminShell is the gate, and the table and the bucket behind this
 * refuse anyone else on their own (see the migration).
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Copy, Hammer, Receipt, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminShell, { AdminCard } from '@/components/AdminShell';
import { ListError, ListLoading } from '@/components/admin/ListStates';
import Editor from '@/components/marketing/Editor';
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
import { useToast } from '@/components/ui/use-toast';
import { DESIGNS, DOC_KINDS, type DocKind } from '@/lib/marketing';
import {
  deleteDoc,
  duplicateDoc,
  listDocs,
  startDoc,
  type DocSummary,
} from '@/lib/marketingStore';

const KIND_ICON: Record<DocKind, LucideIcon> = {
  booklet: BookOpen,
  expenses: Receipt,
  upgrades: Hammer,
};

const kindLabel = (kind: DocKind) => DOC_KINDS.find((k) => k.id === kind)?.label ?? kind;
const designLabel = (id: string) => DESIGNS.find((d) => d.id === id)?.label ?? id;

/** "Oct 9, 2026". The day is enough: this is a list of documents, not a log. */
const formatDay = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ROW_BUTTON =
  'inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-champagne hover:bg-champagne hover:text-ink-deep disabled:pointer-events-none disabled:opacity-50';

const Library = ({ onOpen }: { onOpen: (id: string) => void }) => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [doomed, setDoomed] = useState<DocSummary | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDocs(await listDocs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the documents.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const start = async (kind: DocKind) => {
    setBusy(true);
    try {
      onOpen(await startDoc(kind, docs?.[0]?.id ?? null));
    } catch {
      toast({ variant: 'destructive', title: 'Could not start a document', description: 'Please try again.' });
      setBusy(false);
    }
  };

  const duplicate = async (doc: DocSummary) => {
    setBusy(true);
    try {
      onOpen(await duplicateDoc(doc.id));
    } catch {
      toast({ variant: 'destructive', title: 'Could not copy that document', description: 'Please try again.' });
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!doomed) return;
    const target = doomed;
    setDoomed(null);
    try {
      await deleteDoc(target.id);
      setDocs((was) => (was ?? []).filter((d) => d.id !== target.id));
    } catch {
      toast({ variant: 'destructive', title: 'Could not delete that document', description: 'Please try again.' });
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <span className="h-px w-10 bg-champagne" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-champagne-ink">
          Start a new one
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {DOC_KINDS.map((kind) => {
          const Icon = KIND_ICON[kind.id];
          return (
            <button
              key={kind.id}
              type="button"
              disabled={busy}
              onClick={() => void start(kind.id)}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-champagne disabled:pointer-events-none disabled:opacity-60"
            >
              <Icon className="h-6 w-6 text-champagne-ink" aria-hidden />
              <span className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">
                {kind.label}
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600">{kind.blurb}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 mt-14 flex items-center gap-4">
        <span className="h-px w-10 bg-champagne" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-champagne-ink">
          Your documents
        </h2>
      </div>

      {error ? (
        <ListError message={error} onRetry={() => void load()} />
      ) : docs === null ? (
        <ListLoading label="Loading" />
      ) : docs.length === 0 ? (
        <AdminCard className="p-10">
          <p className="text-center text-sm text-gray-600">
            Nothing yet. Start a booklet above — type the address or the MLS number and it fills
            itself in.
          </p>
        </AdminCard>
      ) : (
        <AdminCard>
          <ul className="divide-y divide-gray-100">
            {docs.map((doc) => {
              const Icon = KIND_ICON[doc.kind];
              return (
                <li key={doc.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
                  <button
                    type="button"
                    onClick={() => onOpen(doc.id)}
                    className="group flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-champagne-ink" aria-hidden />
                    <span className="min-w-0">
                      <span className="numeral block truncate font-semibold text-ink underline-offset-4 group-hover:underline group-hover:decoration-champagne group-hover:decoration-2">
                        {doc.title || `Untitled ${kindLabel(doc.kind).toLowerCase()}`}
                      </span>
                      <span className="numeral mt-0.5 block text-xs text-gray-500">
                        {kindLabel(doc.kind)} · {designLabel(doc.design)}
                        {doc.mls ? ` · MLS ${doc.mls}` : ''} · {formatDay(doc.updatedAt)}
                      </span>
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={ROW_BUTTON}
                      disabled={busy}
                      onClick={() => void duplicate(doc)}
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      Duplicate
                    </button>
                    <button type="button" className={ROW_BUTTON} onClick={() => setDoomed(doc)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </AdminCard>
      )}

      <AlertDialog open={doomed !== null} onOpenChange={(open) => !open && setDoomed(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              {doomed?.title || 'This untitled document'} and the pictures uploaded for it will be
              removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const AdminMarketing = () => {
  const [params, setParams] = useSearchParams();
  const open = params.get('doc');

  return (
    <AdminShell
      title="Marketing"
      description="Listing booklets, and home expense and upgrade sheets. Choose a listing, pick a design, print."
    >
      {open ? (
        // Keyed on the document, so opening another starts from its own state.
        <Editor key={open} id={open} onClose={() => setParams({})} />
      ) : (
        <Library onOpen={(id) => setParams({ doc: id })} />
      )}
    </AdminShell>
  );
};

export default AdminMarketing;
