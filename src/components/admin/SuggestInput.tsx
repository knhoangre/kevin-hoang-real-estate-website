/**
 * A text field that suggests as you type — the combobox mechanics, and nothing
 * about what is being suggested.
 *
 * Lifted out of AddressAutocomplete when the open-house sheet and the showing
 * tour builder needed the same field over a different source (active listings
 * rather than MassGIS address points). The alternative was a second copy of the
 * keyboard handling, the request cancellation and the ARIA wiring, and those
 * are exactly the parts that drift: a fix to how Escape behaves would have had
 * to be made twice.
 *
 * STILL A PLAIN TEXT FIELD. Every keystroke is the user's own; a suggestion is
 * applied only when chosen, and choosing is optional. If the source is slow or
 * down, the list simply never opens.
 *
 * KEYBOARD FIRST. Arrow keys move, Enter picks, Escape closes — and Enter only
 * picks when the list is open with a highlighted row. Otherwise it falls
 * through to the form, so pressing Enter in a finished field still submits.
 *
 * A combobox in the WAI-ARIA sense: the input owns the listbox via
 * aria-controls, and the highlighted row is announced through
 * aria-activedescendant, so a screen reader hears each suggestion as the arrow
 * keys reach it without focus ever leaving the input.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

/** Long enough that a keystroke-per-request never happens; short enough to feel live. */
const DEBOUNCE_MS = 250;

export interface SuggestInputProps<T> {
  id: string;
  value: string;
  /** Every keystroke, exactly as typed. */
  onChange: (value: string) => void;
  /**
   * A suggestion was chosen. The parent MUST write `valueOf(item)` into `value`
   * — that is how this tells a choice from typing, and so does not reopen the
   * list over the row that was just picked.
   */
  onSelect: (item: T) => void;

  /*
   * The four below are read inside an effect. Pass module-level functions, not
   * inline arrows: a new identity on every render would restart the request on
   * every render.
   */
  /** Whether what has been typed is worth a request at all. */
  worth: (text: string) => boolean;
  /** The request. Must honour the signal, or a slow answer can overwrite a newer one. */
  suggest: (text: string, signal: AbortSignal) => Promise<T[]>;
  /** What choosing an item puts in the field. */
  valueOf: (item: T) => string;
  keyOf: (item: T) => string;

  renderItem: (item: T) => React.ReactNode;
  /** Names the listbox for a screen reader — "Suggested addresses". */
  listLabel: string;
  /** One quiet line under the list: where the suggestions come from. */
  footer?: React.ReactNode;

  required?: boolean;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Passed straight to the input, for the surfaces that style theirs differently. */
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'id' | 'value' | 'onChange' | 'required' | 'placeholder'
  >;
}

function SuggestInput<T>({
  id,
  value,
  onChange,
  onSelect,
  worth,
  suggest,
  valueOf,
  keyOf,
  renderItem,
  listLabel,
  footer,
  required,
  placeholder,
  inputRef,
  inputProps,
}: SuggestInputProps<T>) {
  const listId = useId();
  const [items, setItems] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  /*
   * The value a suggestion just wrote into the field. Choosing one changes
   * `value`, which would otherwise look like typing and immediately reopen the
   * list over the row that was just picked.
   */
  const chosen = useRef<string | null>(null);

  useEffect(() => {
    if (chosen.current !== null && value === chosen.current) return undefined;
    chosen.current = null;

    if (!worth(value)) {
      setItems([]);
      setOpen(false);
      return undefined;
    }

    // Each keystroke cancels the request the last one started, so a slow
    // response for "151 w" can never arrive after, and overwrite, the list
    // for "151 wash".
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const next = await suggest(value, controller.signal);
        if (controller.signal.aborted) return;
        setItems(next);
        setActive(-1);
        setOpen(next.length > 0);
      } catch {
        // Aborted or unreachable. The field stays a plain text input.
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, worth, suggest]);

  const choose = (item: T) => {
    chosen.current = valueOf(item);
    setOpen(false);
    setActive(-1);
    onSelect(item);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      // Only when a row is highlighted — otherwise Enter submits the form as
      // it always has.
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <div className="relative">
      <Input
        {...inputProps}
        ref={inputRef}
        id={id}
        required={required}
        placeholder={placeholder}
        value={value}
        // The browser's own autofill would open on top of this list.
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (items.length > 0 && chosen.current === null) setOpen(true);
        }}
        // A tick of delay so a click on a row lands before the list closes.
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />

      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-lg">
          <ul id={listId} role="listbox" aria-label={listLabel} className="max-h-72 overflow-y-auto py-1">
            {items.map((item, i) => (
              <li
                key={keyOf(item)}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: click fires after the input's blur
                // has already closed the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(item);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-start gap-2.5 px-3 py-2 text-sm ${
                  i === active ? 'bg-bone' : ''
                }`}
              >
                {renderItem(item)}
              </li>
            ))}
          </ul>
          {footer && (
            <p className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400">
              {footer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SuggestInput;
