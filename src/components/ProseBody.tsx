/**
 * The site's one long-form typography treatment.
 *
 * This exact class string was copy-pasted into LandingPage and ViPage and
 * half-copied into /about, which is how three pages that are meant to read
 * identically start drifting apart one edit at a time.
 *
 * `max-w-none` is deliberate: the width cap belongs on the wrapper outside
 * this, so `prose`'s own 65ch max-width does not fight it from inside the same
 * class list.
 */
const ProseBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`prose prose-lg max-w-none prose-headings:text-ink prose-h2:font-display prose-h2:font-semibold prose-h2:mt-16 prose-h2:mb-5 prose-h2:text-3xl md:prose-h2:text-4xl prose-p:leading-relaxed prose-a:text-ink prose-a:underline prose-a:decoration-champagne prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:decoration-ink prose-strong:text-ink prose-li:marker:text-champagne ${className}`}
  >
    {children}
  </div>
);

export default ProseBody;
