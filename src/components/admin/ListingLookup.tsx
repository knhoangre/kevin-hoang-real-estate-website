/**
 * An address field that finds the listing it is talking about.
 *
 * Typing "12 elm" or pasting an MLS number offers the active listings that
 * match, and choosing one hands the parent the listing itself — which is what
 * lets an open-house sign-in or a showing stop carry a link to that home on
 * this site, rather than a line of text somebody then looks up on Zillow.
 *
 * Same field as AddressAutocomplete underneath (SuggestInput), over a different
 * source. And like it, STILL A PLAIN TEXT FIELD: a home that is not in the MLS
 * feed — an exclusive, a listing entered an hour ago — is typed by hand exactly
 * as before, and simply carries no link.
 */
import { Home } from 'lucide-react';
import SuggestInput, { type SuggestInputProps } from '@/components/admin/SuggestInput';
import { formatPrice } from '@/lib/listings';
import { SITE } from '@/lib/siteConfig';
import {
  isWorthLookingUp,
  statusLabel,
  suggestListings,
  type ListingSuggestion,
  type SuggestionScope,
} from '@/lib/idxSearch';

interface Props {
  id: string;
  value: string;
  /** Every keystroke, exactly as typed. */
  onChange: (value: string) => void;
  /** A listing was chosen. The parent must write its `address` into `value`. */
  onSelect: (listing: ListingSuggestion) => void;
  required?: boolean;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  inputProps?: SuggestInputProps<ListingSuggestion>['inputProps'];
  /**
   * 'active' (the default) offers what is on the market; 'all' offers every
   * listing in the database, sold ones included. See SuggestionScope.
   */
  scope?: SuggestionScope;
}

/** The served towns, floated to the top: an open house is likelier in Newton than in Lowell. */
const PREFERRED_TOWNS = SITE.areaServed.map((t) => t.name);

// Module scope: SuggestInput reads these in an effect and needs them stable.
// One function per scope, both at module scope, rather than one built from the
// prop: an inline arrow would restart the request on every render.
const suggest = (text: string, signal: AbortSignal) =>
  suggestListings(text, signal, PREFERRED_TOWNS);
const suggestAll = (text: string, signal: AbortSignal) =>
  suggestListings(text, signal, PREFERRED_TOWNS, 'all');
const addressOf = (l: ListingSuggestion) => l.address ?? '';
const mlsOf = (l: ListingSuggestion) => l.mls_number;

const renderListing = (l: ListingSuggestion) => (
  <>
    <Home className="mt-0.5 h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
    <span className="min-w-0">
      <span className="block font-medium text-ink">{l.address}</span>
      <span className="numeral block text-xs text-gray-500">
        {[l.town, l.state].filter(Boolean).join(', ')} {l.zip}
        {' · '}
        {formatPrice(l.list_price)}
        {l.prop_type === 'RN' ? '/mo' : ''}
        {statusLabel(l.status) ? ` · ${statusLabel(l.status)}` : ''}
        {/* The sold feed keeps a listing's last status, which is not always
            "Sold" — so a closed listing is marked by its feed. */}
        {l.feed === 'sold' && statusLabel(l.status) !== 'Sold' ? ' · Sold' : ''}
        {' · MLS '}
        {l.mls_number}
      </span>
    </span>
  </>
);

const ListingLookup = ({
  id,
  value,
  onChange,
  onSelect,
  required,
  placeholder,
  inputRef,
  inputProps,
  scope = 'active',
}: Props) => (
  <SuggestInput<ListingSuggestion>
    inputRef={inputRef}
    inputProps={inputProps}
    id={id}
    value={value}
    onChange={onChange}
    onSelect={onSelect}
    worth={isWorthLookingUp}
    suggest={scope === 'all' ? suggestAll : suggest}
    valueOf={addressOf}
    keyOf={mlsOf}
    renderItem={renderListing}
    listLabel="Matching listings"
    footer={
      scope === 'all'
        ? 'Every listing from MLS PIN, sold ones included. Add the town after a comma to narrow it.'
        : 'Active listings from MLS PIN. Not there? Keep typing the address.'
    }
    required={required}
    placeholder={placeholder}
  />
);

export default ListingLookup;
