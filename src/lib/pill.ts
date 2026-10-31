import { cn } from '@/lib/utils';

/**
 * The site's one button: a pill that lifts, highlights in champagne and has a
 * band of light sweep across it on hover (`.btn-pill` in index.css).
 *
 * Every button with a label goes through here or through <Button>, which reads
 * these same tones. Until 2026-10-30 each page carried its own copy of the class
 * string: about half had the sheen, the contact forms had a white bar along the
 * bottom instead, and sign-in, the CRM and the kiosks were square-cornered.
 *
 * The sheen is white, so a tone must END its hover on a colour white shows up
 * on. That is why an outline fills with champagne rather than only changing its
 * border: on a white page the band would be there and nobody could see it.
 *
 * Not for tiles, filter chips, icon-only buttons, text links, or the small
 * segments of a switch ($ / %): those are not buttons on this site's terms.
 */
const BASE =
  'btn-pill inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:pointer-events-none disabled:opacity-50';

export const PILL_TONES = {
  // On a light surface.
  ink: 'btn-pill-light bg-ink-deep text-white hover:bg-champagne hover:text-ink-deep',
  outline:
    'btn-pill-light border border-gray-300 text-ink hover:border-champagne hover:bg-champagne hover:text-ink-deep',
  danger:
    'btn-pill-light border border-gray-300 text-gray-600 hover:border-red-600 hover:bg-red-600 hover:text-white',
  dangerSolid: 'btn-pill-light bg-red-600 text-white hover:bg-red-700 hover:text-white',
  // On a dark surface, or over a photograph.
  white: 'bg-white text-ink-deep hover:bg-champagne',
  champagne: 'bg-champagne text-ink-deep hover:bg-champagne-ink hover:text-white',
  gold: 'border border-champagne/60 text-champagne hover:bg-champagne hover:text-ink-deep',
  ghost: 'border border-white/25 text-white hover:border-champagne hover:text-champagne',
  dangerOnDark: 'border border-red-400/50 text-red-300 hover:bg-red-500 hover:text-white',
} as const;

const SIZES = {
  lg: 'px-7 py-3.5 text-sm tracking-wide',
  md: 'px-6 py-3 text-sm',
  sm: 'px-5 py-2.5 text-sm',
  xs: 'gap-1.5 px-3.5 py-1.5 text-xs',
} as const;

export type PillTone = keyof typeof PILL_TONES;

/** `extra` is merged last, so a margin, `w-full` or a colour in it wins. */
export const pill = (tone: PillTone, size: keyof typeof SIZES = 'sm', extra?: string) =>
  cn(BASE, PILL_TONES[tone], SIZES[size], extra);

/** A tab in a rounded track: it shines like a button but stays inside the track. */
export const pillTab = (active: boolean) =>
  cn(
    BASE,
    'btn-pill-flat px-4 py-2 text-sm sm:px-5',
    active ? 'bg-ink-deep text-white' : 'text-gray-700 hover:bg-champagne hover:text-ink-deep'
  );
