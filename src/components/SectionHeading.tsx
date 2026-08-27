/**
 * A section heading with the champagne rule above it.
 *
 * The rule is `bg-champagne` rather than `text-champagne` on purpose — champagne
 * is 2.33:1 on white and may only appear as a non-text mark on a light surface.
 * See the token table in tailwind.config.ts.
 */
const SectionHeading = ({
  children,
  id,
  as: As = 'h2',
  className = '',
}: {
  children: React.ReactNode;
  id?: string;
  as?: 'h2' | 'h3';
  className?: string;
}) => (
  <>
    <span className="mb-5 block h-px w-10 bg-champagne" aria-hidden />
    <As id={id} className={`font-display text-3xl md:text-4xl font-semibold text-ink ${className}`}>
      {children}
    </As>
  </>
);

export default SectionHeading;
