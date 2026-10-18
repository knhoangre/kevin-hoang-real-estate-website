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
 * THE LIST IS FOR SOMEBODY TYPING, AND FOR NOTHING ELSE. It asks only about
 * text typed into the field, and is open only while the field has focus. Until
 * 2026-10-18 it asked about whatever the field held: an address already there —
 * a link's address opened for correcting, a new link started from a property,
 * a property picked from the list, a booklet reopened — fetched suggestions
 * the moment it appeared and opened them in a field nobody had touched. Since
 * a list that opens without focus is never closed by blur, it then stayed open
 * over the Unit box beneath it, which could not be tapped (Kevin: "it
 * shouldn't pop up indefinitely because there is some text in there"). So:
 *   - a value set from outside (prefilled, picked, reset) asks nothing, and
 *     clears any list there was;
 *   - choosing a suggestion closes the list, and it stays closed until the
 *     next keystroke — tapping back into the field does not reopen it;
 *   - leaving the field closes the list, and coming back to text that was
 *     being typed, and not yet chosen, shows the same list again.
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
  /** A suggestion was chosen. The parent writes what it wants into `value`. */
  onSelect: (item: T) => void;

  /*
   * The three below are read inside an effect. Pass module-level functions, not
   * inline arrows: a new identity on every render would restart the request on
   * every render.
   */
  /** Whether what has been typed is worth a request at all. */
  worth: (text: string) => boolean;
  /** The request. Must honour the signal, or a slow answer can overwrite a newer one. */
  suggest: (text: string, signal: AbortSignal) => Promise<T[]>;
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
   * What was last TYPED into the field — the only text the list is ever about.
   * Null when the field's text came from anywhere else: a prefill, a choice, a
   * reset.
   */
  const [typed, setTyped] = useState<string | null>(null);
  const focused = useRef(false);

  // The field changed from outside: whatever the list said is about other text.
  useEffect(() => {
    if (typed !== null && value === typed) return;
    setTyped(null);
    setItems([]);
    setOpen(false);
    setActive(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new value means this
  }, [value]);

  useEffect(() => {
    if (typed === null || !worth(typed)) {
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
        const next = await suggest(typed, controller.signal);
        if (controller.signal.aborted) return;
        setItems(next);
        setActive(-1);
        // Answered after the field was left: kept for coming back, not shown.
        setOpen(focused.current && next.length > 0);
      } catch {
        // Aborted or unreachable. The field stays a plain text input.
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [typed, worth, suggest]);

  const choose = (item: T) => {
    // The list is done with: what the parent writes next is a value from
    // outside, which the effect above treats as the end of this list.
    setTyped(null);
    setItems([]);
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
        onChange={(e) => {
          setTyped(e.target.value);
          onChange(e.target.value);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => {
          focused.current = true;
          // Back to text that was being typed: the same list, again. An address
          // that was chosen or filled in has no list to come back to.
          if (typed !== null && items.length > 0) setOpen(true);
        }}
        onBlur={() => {
          focused.current = false;
          // A tick of delay so a click on a row lands before the list closes.
          window.setTimeout(() => {
            if (!focused.current) setOpen(false);
          }, 120);
        }}
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
