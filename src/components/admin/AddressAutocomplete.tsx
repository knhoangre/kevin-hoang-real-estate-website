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
 * The keyboard handling, request cancellation and ARIA wiring are SuggestInput's;
 * this file is only what is MassGIS about it — the source, the towns floated to
 * the top, and how a suggestion reads.
 */
import { forwardRef } from 'react';
import { MapPin } from 'lucide-react';
import SuggestInput from '@/components/admin/SuggestInput';
import { SITE } from '@/lib/siteConfig';
import { isWorthSuggesting, suggestAddresses, type AddressSuggestion } from '@/lib/massgis';

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

// Module scope: SuggestInput reads these in an effect and needs them stable.
const suggest = (text: string, signal: AbortSignal) =>
  suggestAddresses(text, signal, PREFERRED_TOWNS);
const streetOf = (s: AddressSuggestion) => s.street;
const labelOf = (s: AddressSuggestion) => s.label;

const renderSuggestion = (s: AddressSuggestion) => (
  <>
    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
    <span>
      <span className="block font-medium text-ink">{s.street}</span>
      <span className="numeral block text-xs text-gray-500">
        {s.town}, {s.state} {s.zip}
        {s.unitHint ? ` · units ${s.unitHint}` : ''}
      </span>
    </span>
  </>
);

const AddressAutocomplete = forwardRef<HTMLInputElement, Props>(
  ({ id, value, onChange, onSelect, required, placeholder }, ref) => (
    <SuggestInput<AddressSuggestion>
      inputRef={ref}
      id={id}
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      worth={isWorthSuggesting}
      suggest={suggest}
      valueOf={streetOf}
      keyOf={labelOf}
      renderItem={renderSuggestion}
      listLabel="Suggested addresses"
      footer="Massachusetts addresses from MassGIS. Not listed? Just keep typing."
      required={required}
      placeholder={placeholder}
    />
  )
);

AddressAutocomplete.displayName = 'AddressAutocomplete';

export default AddressAutocomplete;
