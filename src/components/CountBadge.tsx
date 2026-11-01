import { cn } from '@/lib/utils';

/**
 * The red number on anything waiting for Kevin. It draws nothing at zero.
 * `label` finishes the sentence for a screen reader ("3 unread").
 *
 * `corner` pins it to the corner of a picture or button, which has to be
 * `relative`. There it stops at 99+, so it never covers what it sits on.
 */
const CountBadge = ({
  count,
  label,
  corner = false,
  className,
}: {
  count: number;
  label: string;
  corner?: boolean;
  className?: string;
}) =>
  count > 0 ? (
    <span
      className={cn(
        'rounded-full bg-red-600 px-2 py-0.5 text-[0.65rem] font-semibold text-white',
        corner && 'absolute -right-1.5 -top-1.5 min-w-[1.25rem] px-1 text-center leading-4 ring-2 ring-white',
        className
      )}
    >
      {corner && count > 99 ? '99+' : count}
      <span className="sr-only"> {label}</span>
    </span>
  ) : null;

export default CountBadge;
