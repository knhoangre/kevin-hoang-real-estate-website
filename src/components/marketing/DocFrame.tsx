import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import css from './designs/print.css?raw';

/**
 * The sheet of paper: a marketing document drawn in a frame of its own, and
 * printed from it.
 *
 * WHY A FRAME. Two reasons, and each alone would be enough.
 *
 *   * The site's print stylesheet is written for the rental application and the
 *     listing sheet: every printed page is 7.5pt, portrait, margins of 10mm,
 *     buttons hidden, dark backgrounds stripped. All of it is `!important`. A
 *     booklet is landscape, edge to edge, and one design is mostly black. In a
 *     frame none of those rules exist — the document brings its own stylesheet
 *     (print.css, as text) and its own `@page`.
 *
 *   * What is on screen IS what prints. The preview is not a second rendering
 *     that resembles the printout; it is the same document, scaled down as a
 *     whole. Tailwind's reset is not in here either, so there is no rule that
 *     applies in one and not the other.
 *
 * WHY THE BROWSER'S PRINT BOX, and not a PDF built on the page the way the
 * rental application's is. That one is assembled with pdf-lib from files the
 * site can read. A booklet is made of MLS PIN's photographs, whose host sends
 * no CORS header: a page may show them and may not read them, so there is
 * nothing to hand pdf-lib. The print engine has no such limit — it places each
 * photograph at its full size — and "Save as PDF" in that box is the file.
 *
 * The React tree is PORTALLED into the frame's body, so the designs are
 * ordinary components that share state with the editor around them; React
 * delegates their events at the portal's container, which is why clicking and
 * dragging a picture in there works at all.
 */

const FONTS =
  'https://fonts.googleapis.com/css2?family=Allura&family=Carlito:wght@400;700&family=Crete+Round&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap';

/** Paper, in CSS pixels at 96 to the inch. */
const PAPER = {
  booklet: { w: 1056, h: 816, size: '11in 8.5in' },
  sheet: { w: 816, h: 1056, size: '8.5in 11in' },
} as const;

export interface DocFrameHandle {
  /** Open the browser's print box for the document, once its fonts and pictures are in. */
  print: () => Promise<void>;
}

interface Props {
  family: 'booklet' | 'sheet';
  /** What a saved PDF is called. */
  title: string;
  children: React.ReactNode;
}

const DocFrame = forwardRef<DocFrameHandle, Props>(({ family, title, children }, ref) => {
  const paper = PAPER[family];
  const wrap = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState<number>(paper.h);
  const [scale, setScale] = useState(1);

  // A whole document with a doctype: an empty frame is in quirks mode, where
  // line heights and box sizes are a different set of rules.
  const srcDoc = useMemo(
    () =>
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title></title>` +
      `<link rel="preconnect" href="https://fonts.googleapis.com">` +
      `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
      `<link rel="stylesheet" href="${FONTS}">` +
      `<style>${css}</style>` +
      // The paper size and no margins, so the print box opens already set.
      `<style>@page{size:${paper.size};margin:0}</style>` +
      `</head><body></body></html>`,
    [paper.size]
  );

  // The frame grows with its pages: a long upgrade list is two sheets, three.
  useEffect(() => {
    const view = iframe.current?.contentWindow as (Window & typeof globalThis) | null | undefined;
    if (!body || !view) return;
    const measure = () => setHeight(Math.max(paper.h, Math.ceil(body.scrollHeight)));
    measure();
    const observer = new view.ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [body, paper.h]);

  // Scaled down to the column it sits in, never up.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / paper.w));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [paper.w]);

  useImperativeHandle(
    ref,
    () => ({
      print: async () => {
        const view = iframe.current?.contentWindow;
        const doc = iframe.current?.contentDocument;
        if (!view || !doc) return;
        doc.title = title;
        // Printing before the faces arrive sets the page in a fallback serif;
        // before a photograph arrives, with a hole where it goes.
        try {
          await doc.fonts.ready;
        } catch {
          // No font loading API: print with what there is.
        }
        await Promise.all(
          Array.from(doc.images).map((img) =>
            img.complete
              ? null
              : new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve(), { once: true });
                  img.addEventListener('error', () => resolve(), { once: true });
                })
          )
        );
        view.focus();
        view.print();
      },
    }),
    [title]
  );

  return (
    <div ref={wrap} className="w-full overflow-hidden" style={{ height: height * scale }}>
      <iframe
        ref={iframe}
        title="Document preview"
        srcDoc={srcDoc}
        scrolling="no"
        onLoad={(event) => setBody(event.currentTarget.contentDocument?.body ?? null)}
        style={{
          display: 'block',
          width: paper.w,
          height,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
      {body && createPortal(children, body)}
    </div>
  );
});

DocFrame.displayName = 'DocFrame';

export default DocFrame;
