import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A plain `<select>` whose arrow is ours, not the browser's.
 *
 * The browser places its own arrow, and not in one place: Chrome honours the
 * select's right padding, while Safari — every iPhone — draws it hard against
 * the right border whatever the padding says. That is what Kevin saw on
 * /admin/applications on 2026-10-29. `appearance-none` removes the browser's
 * arrow everywhere and the chevron goes 12px in, level with the text's own
 * 12px on the left, the same as the shadcn Select's trigger.
 *
 * Still a native select, on purpose: on a phone it opens the system picker,
 * which is what a thumb wants for a short list.
 *
 * `className` styles the select itself, exactly as it did before this existed;
 * `wrapperClassName` is for what belongs outside it — a top margin, a width.
 * The right padding is applied last so a caller's `px-*` cannot put the text
 * back underneath the chevron.
 */
export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => (
    // A span, so it is also valid inside a <label>.
    <span className={cn('relative block', wrapperClassName)}>
      <select ref={ref} className={cn(className, 'appearance-none pr-9')} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
        aria-hidden
      />
    </span>
  )
);
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
