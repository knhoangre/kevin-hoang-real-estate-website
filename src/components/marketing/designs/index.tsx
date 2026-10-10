import { designOf, type MarketingDoc } from '@/lib/marketing';
import { ClassicBooklet, GalleryBooklet, NoirBooklet, WelcomeBooklet } from './Booklets';
import { ClassicSheet, GallerySheet, NoirSheet } from './Sheets';

/**
 * A design's name -> the component that draws it.
 *
 * The names are DESIGNS in marketing.ts, which is where a design is declared —
 * its frames, how many facts it shows. This is the other half: add a design
 * there and forget it here, and it draws as its family's first rather than as
 * nothing.
 */
const DRAW: Record<string, (props: { doc: MarketingDoc }) => JSX.Element> = {
  classic: ClassicBooklet,
  welcome: WelcomeBooklet,
  noir: NoirBooklet,
  gallery: GalleryBooklet,
  'sheet-classic': ClassicSheet,
  'sheet-noir': NoirSheet,
  'sheet-gallery': GallerySheet,
};

/** The pages of a document, in whichever design it names. */
const DocPages = ({ doc }: { doc: MarketingDoc }) => {
  const design = designOf(doc);
  const Draw = DRAW[design.id] ?? (design.family === 'booklet' ? ClassicBooklet : ClassicSheet);
  return <Draw doc={doc} />;
};

export default DocPages;
