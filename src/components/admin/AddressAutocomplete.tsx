/**
 * A street-address field that suggests real Massachusetts addresses as you type.
 *
 * "151 wash" offers "151 Washington St, Cambridge, MA 02139", and picking it
 * fills the town, state and ZIP as well — which is the point: those are the
 * fields somebody setting up a rental most often does not have to hand. The
 * data and the reasoning for MassGIS are in src/lib/massgis.ts.
 *
 * STILL A PLAIN TEXT FIELD. Every keystroke is the admin's own; a suggestion is
 * applied only when chosen, and choosing is optional. If MassGIS is slow or
 * down, the list simply never opens and the field behaves exactly as it did
 * before this existed. An address outside Massachusetts, or one too new for the
 * state's address points, is typed by hand as it always was.
 *
 * KEYBOARD FIRST. Arrow keys move, Enter picks, Escape closes — and Enter only
 * picks when the list is open with a highlighted row. Otherwise it falls
 * through to the form, so pressing Enter in a field the admin has finished with
 * still submits as it did.
 *
 * A combobox in the WAI-ARIA sense: the input owns the listbox via
 * aria-controls, and the highlighted row is announced through
 * aria-activedescendant, so a screen reader hears each suggestion as the arrow
 * keys reach it without focus ever leaving the input.
 */
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SITE } from '@/lib/siteConfig';
import {
  SUGGEST_DEBOUNCE_MS,
  isWorthSuggesting,
  suggestAddresses,
  type AddressSuggestion,
} from '@/lib/massgis';

interface Props {
  id: string;
  value: string;
  /** Every keystroke, exactly as typed. */
  onChange: (value: string) => void;
  /** A suggestion was chosen. The parent fills whatever fields it has. */
  onSelect: (suggestion: AddressSuggestion) => void;
  required?: boolean;
  placeholder?: string;
}

/** The served towns, floated to the top of the local results. */
const PREFERRED_TOWNS = SITE.areaServed.map((t) => t.name);

const AddressAutocomplete = forwardRef<HTMLInputElement, Props>(
  ({ id, value, onChange, onSelect, required, placeholder }, ref) => {
    const listId = useId();
    const [items, setItems] = useState<AddressSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    /*
     * The value a suggestion just wrote into the field. Choosing one changes
     * `value`, which would otherwise look like typing and immediately reopen the
     * list over the address that was just picked.
     */
    const chosen = useRef<string | null>(null);

    useEffect(() => {
      if (chosen.current !== null && value === chosen.current) return undefined;
      chosen.current = null;

      if (!isWorthSuggesting(value)) {
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
          const next = await suggestAddresses(value, controller.signal, PREFERRED_TOWNS);
          if (controller.signal.aborted) return;
          setItems(next);
          setActive(-1);
          setOpen(next.length > 0);
        } catch {
          // Aborted or unreachable. The field stays a plain text input.
        }
      }, SUGGEST_DEBOUNCE_MS);

      return () => {
        window.clearTimeout(timer);
        controller.abort();
      };
    }, [value]);

    const choose = (s: AddressSuggestion) => {
      chosen.current = s.street;
      setOpen(false);
      setActive(-1);
      onSelect(s);
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
          ref={ref}
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
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            <ul id={listId} role="listbox" aria-label="Suggested addresses" className="max-h-72 overflow-y-auto py-1">
              {items.map((s, i) => (
                <li
                  key={s.label}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  // mousedown, not click: click fires after the input's blur
                  // has already closed the list.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(s);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-start gap-2.5 px-3 py-2 text-sm ${
                    i === active ? 'bg-bone' : ''
                  }`}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
                  <span>
                    <span className="block font-medium text-ink">{s.street}</span>
                    <span className="numeral block text-xs text-gray-500">
                      {s.town}, {s.state} {s.zip}
                      {s.unitHint ? ` · units ${s.unitHint}` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400">
              Massachusetts addresses from MassGIS. Not listed? Just keep typing.
            </p>
          </div>
        )}
      </div>
    );
  }
);

AddressAutocomplete.displayName = 'AddressAutocomplete';

export default AddressAutocomplete;
