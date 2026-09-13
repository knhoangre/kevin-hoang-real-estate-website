/**
 * One file: the application, then every document the applicant uploaded.
 *
 * Separate from the Print button, which stays. Print is the browser's own dialog
 * over the page that is already on screen — fast, and what you want for a paper
 * copy — but JavaScript cannot reach those bytes, so it can never include the
 * attachments. This is the version to send to an owner.
 *
 * The documents are loaded here rather than passed in: DocumentsPanel keeps its
 * own list for display, and reading it again costs one query against an index
 * while sharing state between them would mean lifting it into both pages.
 */
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { listDocuments, type RentalApplicationRecord } from '@/lib/rentalApplication';
import { buildApplicationPdf, pdfFileName } from '@/lib/applicationPdf';

export default function DownloadPdfButton({
  record,
  className,
}: {
  record: RentalApplicationRecord;
  className?: string;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const documents = await listDocuments(record.id);
      const bytes = await buildApplicationPdf({ record, documents });

      // A Blob and an object URL, not a data: URI — a merged tax return can be
      // several megabytes and a data: URI of that size is refused by some
      // browsers outright.
      const url = URL.createObjectURL(
        new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFileName(record);
      a.click();
      // Revoked on a tick, not immediately: Safari has not started the download
      // by the time click() returns.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      console.error('Could not build the application PDF:', err);
      toast({
        variant: 'destructive',
        title: 'Could not build the PDF',
        description: 'Please try again in a moment.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={busy}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-champagne hover:text-champagne-ink disabled:opacity-60'
      }
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {busy ? 'Building PDF' : 'Download PDF'}
    </button>
  );
}
