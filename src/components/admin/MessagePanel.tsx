/**
 * The two ways out of a showing tour or a message of listings: a text Kevin sends
 * himself, and an email sent from here.
 *
 *   - Text: GENERATED here and sent by Kevin from his own phone. Nothing is sent
 *     by this panel when a text is generated, and no email address is needed.
 *   - Email: sent from here, with Kevin on cc.
 *
 * What the message says comes from the page's edge function, in one call that
 * returns the text and the HTML together, so the two cannot disagree. This panel
 * knows nothing about tours or listings: the page passes `build` and `send`.
 */
import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Mail, MessageSquare, Users } from 'lucide-react';
import { ADMIN_BUTTON } from '@/components/AdminShell';
import { useToast } from '@/components/ui/use-toast';
import { sentStamp } from '@/lib/showingTours';
import { smsHrefTo, smsHrefToGroup } from '@/lib/siteConfig';
import { sentenceList } from '@/lib/utils';

export interface MessagePreview {
  subject: string;
  /** Ready to paste or to open in Messages. */
  text: string;
  /** The email exactly as it would be sent. */
  html: string;
  /** Something Kevin should know about what is and is not in it. */
  notice?: string | null;
}

export interface MessagePerson {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

/** The sentences that differ between one page and another. */
export interface MessageWords {
  textLede: string;
  /** Names the text box for a screen reader. */
  textLabel: string;
  emailLede: (who: string) => string;
  noEmail: string;
  sentTitle: string;
  buildError: string;
  notReady: string;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0];

/**
 * Enough rows that the signature is not hidden under a scroll. Counting line
 * breaks alone was not: a listing's link wraps once on a laptop and twice on a
 * phone. Forty-two characters is about a phone's width, and a box a little too
 * tall on a laptop costs nothing.
 */
const rowsFor = (text: string) =>
  Math.min(
    40,
    text.split('\n').reduce((rows, line) => rows + Math.max(1, Math.ceil(line.length / 42)), 1)
  );

const MessagePanel = ({
  people,
  sentAt,
  fingerprint,
  ready,
  build,
  send,
  onSent,
  words,
}: {
  people: MessagePerson[];
  sentAt: string | null;
  /** Anything that changes what the message says. See the effect below. */
  fingerprint: string;
  /** Whether there is anything to write about yet. */
  ready: boolean;
  build: () => Promise<MessagePreview>;
  send: () => Promise<{ sentAt: string; notice?: string | null }>;
  onSent: (sentAt: string) => void;
  words: MessageWords;
}) => {
  const { toast } = useToast();
  const [preview, setPreview] = useState<MessagePreview | null>(null);
  const [building, setBuilding] = useState<'text' | 'email' | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  /*
   * A preview describes the message as it was when it was built. Any edit makes
   * it a description of something that no longer exists, and the worst outcome
   * here is texting one. So it is thrown away whenever the content changes and
   * has to be asked for again.
   */
  useEffect(() => {
    setPreview(null);
    setShowEmail(false);
  }, [fingerprint]);

  const emails = [...new Set(people.flatMap((p) => (p.email ? [p.email] : [])))];
  const emailList = sentenceList(emails);
  const texting = people.filter((p) => p.phone);
  // Asked once, after mount — this page is prerendered, and there is no
  // navigator there to ask. It only chooses which form of group link to write.
  const [apple, setApple] = useState(true);
  useEffect(() => {
    setApple(/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent));
  }, []);

  const generate = async (which: 'text' | 'email') => {
    if (building) return;
    setBuilding(which);
    try {
      setPreview(await build());
      if (which === 'email') setShowEmail(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: words.buildError,
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBuilding(null);
    }
  };

  const sendEmail = async () => {
    if (sending || emails.length === 0) return;
    setSending(true);
    try {
      const result = await send();
      onSent(result.sentAt);
      toast({
        title: words.sentTitle,
        description: [`Sent to ${emailList}, with you on cc.`, result.notice].filter(Boolean).join(' '),
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not send the email',
        description: err instanceof Error ? err.message : 'Please try again in a moment.',
      });
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard needs a secure context and a permission. The text is in a
      // selectable box right there, which is the fallback that always works.
      toast({ title: 'Select the text in the box and copy it.' });
    }
  };

  return (
    <div className="grid gap-px bg-gray-200 md:grid-cols-2">
      {preview?.notice && (
        <p className="bg-white p-4 text-sm text-amber-800 sm:px-6 md:col-span-2">{preview.notice}</p>
      )}

      {/* ---- Text ---- */}
      <div className="space-y-4 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-champagne-ink" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Text message</h3>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">{words.textLede}</p>
        <button
          type="button"
          onClick={() => generate('text')}
          disabled={!ready || building !== null}
          className={ADMIN_BUTTON}
        >
          {building === 'text' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MessageSquare className="h-4 w-4" aria-hidden />
          )}
          {preview ? 'Rebuild the text' : 'Generate text message'}
        </button>

        {preview && (
          <div className="space-y-3">
            <textarea
              readOnly
              value={preview.text}
              rows={rowsFor(preview.text)}
              aria-label={words.textLabel}
              onFocus={(e) => e.currentTarget.select()}
              className="numeral w-full rounded-md border border-gray-200 bg-bone p-3 text-sm leading-relaxed text-ink"
            />
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
              >
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {texting.length === 0 && (
                <span className="text-xs text-gray-500">
                  Add a phone number above to open it straight in Messages.
                </span>
              )}
            </div>
            {texting.length > 0 && (
              /* One link per person, always. With two or more there is also a
                 group link, FIRST because one thread is what a couple expects —
                 but it is the form Apple does not document (see smsHrefToGroup),
                 so the individual links are never replaced by it. */
              <ul className="space-y-2 border-t border-gray-100 pt-3">
                {texting.length > 1 && (
                  <li>
                    <a
                      href={smsHrefToGroup(
                        texting.map((p) => p.phone as string),
                        preview.text,
                        apple
                      )}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
                    >
                      <Users className="h-4 w-4" aria-hidden />
                      Open one group text to {sentenceList(texting.map((p) => firstName(p.name)))}
                    </a>
                  </li>
                )}
                {texting.map((p) => (
                  <li key={p.id}>
                    <a
                      href={smsHrefTo(p.phone as string, preview.text)}
                      className="numeral inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
                    >
                      <MessageSquare className="h-4 w-4" aria-hidden />
                      {texting.length > 1
                        ? `Text ${firstName(p.name)} only — ${p.phone}`
                        : `Open in Messages to ${p.phone}`}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ---- Email ---- */}
      <div className="space-y-4 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-champagne-ink" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Email</h3>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          {emails.length > 0 ? words.emailLede(emailList) : words.noEmail}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={sendEmail}
            disabled={!ready || sending || emails.length === 0}
            className={ADMIN_BUTTON}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
            {sentAt ? 'Email it again' : emails.length > 1 ? `Email to all ${emails.length}` : 'Email to client'}
          </button>
          <button
            type="button"
            onClick={() => (showEmail ? setShowEmail(false) : generate('email'))}
            disabled={!ready || building !== null}
            className="text-sm font-medium text-champagne-ink hover:underline disabled:opacity-50"
          >
            {building === 'email' ? 'Building…' : showEmail ? 'Hide the preview' : 'Preview the email'}
          </button>
        </div>
        <p className="numeral text-xs text-gray-500">
          {sentAt ? `Emailed ${sentStamp(sentAt)}.` : 'Not emailed yet.'}
        </p>

        {showEmail && preview && (
          /* `sandbox` with no allowances: the email is our own HTML, but it is
             rendered as a document and nothing in it needs to run. */
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={preview.html}
            className="h-[32rem] w-full rounded-md border border-gray-200 bg-white"
          />
        )}
      </div>

      {!ready && (
        <p className="bg-white px-4 pb-4 text-sm text-gray-600 sm:px-6 sm:pb-6 md:col-span-2">
          {words.notReady}
        </p>
      )}
    </div>
  );
};

export default MessagePanel;
