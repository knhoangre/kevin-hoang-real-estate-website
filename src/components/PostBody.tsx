import { Link } from 'react-router-dom';

/**
 * Renders the tiny markdown subset the blog corpus is written in.
 *
 * It used to live inside BlogPost.tsx and handled two things: paragraphs, and
 * `**bold**` (a paragraph that was nothing but bold became an h2). That was
 * enough to make every post a wall of prose — a bulleted list written as `- x`
 * rendered as the literal text "- x", so nobody wrote one, so no post had a
 * scannable structure and none of them were extractable as an answer.
 *
 * Supported:
 *   **Heading**            a paragraph that is entirely bold becomes an <h2>
 *   - item                 consecutive lines become a <ul>
 *   1. item                consecutive lines become an <ol>
 *   > text                 becomes a pull quote
 *   **bold** inline
 *   [text](/path)          internal link, routed (no full page reload)
 *   [text](https://…)      external link, opened in a new tab
 *
 * Internal links are the point of the last one: a post that links to the town
 * guide or the buyer guide it is talking about is what turns the corpus into a
 * connected site rather than 76 dead ends.
 */

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;
const BOLD = /\*\*([^*]+)\*\*/g;

/** Inline `**bold**` and `[links]()`, in one pass so they can be adjacent. */
const inline = (text: string, keyPrefix: string): (string | JSX.Element)[] => {
  const out: (string | JSX.Element)[] = [];
  // Split on links first; whatever falls between them can still hold bold.
  let last = 0;
  let m: RegExpExecArray | null;
  LINK.lastIndex = 0;
  const pushBold = (chunk: string, key: string) => {
    let l = 0;
    let b: RegExpExecArray | null;
    BOLD.lastIndex = 0;
    while ((b = BOLD.exec(chunk)) !== null) {
      if (b.index > l) out.push(chunk.slice(l, b.index));
      out.push(
        <strong key={`${key}-b${b.index}`} className="font-semibold text-[#1a1a1a]">
          {b[1]}
        </strong>,
      );
      l = b.index + b[0].length;
    }
    if (l < chunk.length) out.push(chunk.slice(l));
  };

  while ((m = LINK.exec(text)) !== null) {
    if (m.index > last) pushBold(text.slice(last, m.index), `${keyPrefix}-t${m.index}`);
    const [, label, href] = m;
    out.push(
      href.startsWith('/') ? (
        <Link
          key={`${keyPrefix}-l${m.index}`}
          to={href}
          className="text-[#1a1a1a] underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-[#1a1a1a]"
        >
          {label}
        </Link>
      ) : (
        <a
          key={`${keyPrefix}-l${m.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1a1a1a] underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-[#1a1a1a]"
        >
          {label}
        </a>
      ),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) pushBold(text.slice(last), `${keyPrefix}-t${last}`);
  return out;
};

const PostBody = ({ content }: { content: string }) => (
  <>
    {content.split('\n\n').map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      const heading = trimmed.match(/^\*\*(.+?)\*\*$/);
      if (heading) {
        return (
          <h2
            key={i}
            className="mt-14 mb-5 font-display text-2xl md:text-3xl font-semibold text-[#1a1a1a]"
          >
            {heading[1]}
          </h2>
        );
      }

      const lines = trimmed.split('\n');

      if (lines.every((l) => /^-\s+/.test(l.trim()))) {
        return (
          <ul key={i} className="mb-7 list-none space-y-3 p-0">
            {lines.map((line, j) => (
              <li key={j} className="flex gap-3 text-lg leading-relaxed text-gray-700">
                <span className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" aria-hidden />
                <span>{inline(line.trim().replace(/^-\s+/, ''), `${i}-${j}`)}</span>
              </li>
            ))}
          </ul>
        );
      }

      if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
        return (
          <ol key={i} className="mb-7 list-none space-y-3 p-0">
            {lines.map((line, j) => (
              <li key={j} className="flex gap-4 text-lg leading-relaxed text-gray-700">
                <span className="shrink-0 font-display text-lg font-semibold text-champagne">
                  {j + 1}.
                </span>
                <span>{inline(line.trim().replace(/^\d+\.\s+/, ''), `${i}-${j}`)}</span>
              </li>
            ))}
          </ol>
        );
      }

      if (trimmed.startsWith('> ')) {
        return (
          <blockquote
            key={i}
            className="my-10 border-l-2 border-champagne pl-6 font-display text-xl md:text-2xl italic leading-relaxed text-[#1a1a1a]"
          >
            {inline(trimmed.replace(/^>\s+/gm, '').replace(/\n/g, ' '), `q${i}`)}
          </blockquote>
        );
      }

      return (
        <p key={i} className="mb-6 text-lg leading-relaxed text-gray-700">
          {inline(trimmed.replace(/\n/g, ' '), `p${i}`)}
        </p>
      );
    })}
  </>
);

export default PostBody;
