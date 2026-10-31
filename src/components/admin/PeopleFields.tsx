/**
 * The people something is for: a row each, with a name, an email and a phone, the
 * name suggesting from the CRM.
 *
 * A showing tour and a message of listings both go to a couple or a family, and
 * each of them may be reachable a different way. One component, so "who is this
 * for" is one form across the admin, and so the line saying whether each person
 * is in the CRM cannot read two ways.
 */
import { Check, Plus, User, UserPlus, X } from 'lucide-react';
import SuggestInput from '@/components/admin/SuggestInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPhoneInput } from '@/lib/phone';
import {
  blankPerson,
  canFileInCrm,
  isBlankPerson,
  isWorthFindingClient,
  suggestClients,
  type ClientSuggestion,
  type PersonDraft,
} from '@/lib/showingTours';

/** The most people one row lists. Both tables enforce the same ceiling. */
const MAX_PEOPLE = 8;

// Module scope: SuggestInput reads these in an effect and needs them stable.
const clientKey = (c: ClientSuggestion) => String(c.contactId);
const renderClient = (c: ClientSuggestion) => (
  <>
    <User className="mt-0.5 h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
    <span className="min-w-0">
      <span className="block font-medium text-ink">{c.name}</span>
      <span className="numeral block truncate text-xs text-gray-500">
        {[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact details in the CRM'}
      </span>
    </span>
  </>
);

const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The line under a person's row: whether they are in the CRM, and if not, what
 * saving will do about it. Kevin asked that nobody typed here goes missing from
 * the CRM, so the page says which of the three cases each row is rather than
 * leaving it to be found out later on /crm/contacts.
 */
const CrmLine = ({ person, filedBy }: { person: PersonDraft; filedBy: string }) => {
  if (isBlankPerson(person)) return null;
  if (person.contactId !== null) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-800">
        <Check className="h-3.5 w-3.5" aria-hidden />
        In your CRM
      </p>
    );
  }
  if (canFileInCrm(person)) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-champagne-ink">
        <UserPlus className="h-3.5 w-3.5" aria-hidden />
        {capitalised(filedBy)} adds them to your CRM, if they are not in it already.
      </p>
    );
  }
  return (
    <p className="text-xs text-gray-500">
      Not in your CRM. Add a last name and an email or phone, and {filedBy} adds them.
    </p>
  );
};

const PeopleFields = ({
  idPrefix,
  people,
  onChange,
  firstRequired = false,
  removeFrom,
  hint,
  filedBy = 'saving',
}: {
  idPrefix: string;
  people: PersonDraft[];
  onChange: (next: PersonDraft[]) => void;
  /** Whether the first row's name is a required field. */
  firstRequired?: boolean;
  /** Finishes "Remove Tammy from …", for a screen reader. */
  removeFrom: string;
  /** The quiet line beside "Add another person". */
  hint: (several: boolean) => string;
  /** What files somebody in the CRM, in words: "saving adds them". */
  filedBy?: string;
}) => {
  /**
   * Typing in a row. `contactId` is dropped with it: the row was known to be a
   * CRM contact as it stood, and an edited row is a claim nobody has checked
   * until the next save.
   */
  const typed = (id: string, patch: Partial<Pick<PersonDraft, 'name' | 'email' | 'phone'>>) =>
    onChange(people.map((p) => (p.id === id ? { ...p, ...patch, contactId: null } : p)));

  const picked = (id: string, c: ClientSuggestion) =>
    onChange(
      people.map((p) =>
        p.id === id
          ? {
              ...p,
              name: c.name,
              // What the CRM has, without wiping something already typed here
              // when the CRM has nothing.
              email: c.email ?? p.email,
              phone: c.phone ? formatPhoneInput(c.phone) : p.phone,
              contactId: c.contactId,
            }
          : p
      )
    );

  const remove = (id: string) => onChange(people.filter((p) => p.id !== id));

  const several = people.length > 1;

  return (
    <div className="space-y-3">
      {people.map((person, i) => (
        /*
          A fieldset per person, so "Email" and "Phone" are announced as
          belonging to somebody. Keyed on the row's own id, not its position:
          removing the first of two must not hand the second one's typing to
          the first one's inputs.
        */
        <fieldset
          key={person.id}
          className={several ? 'rounded-lg border border-gray-200 p-4' : undefined}
        >
          <legend className={several ? 'numeral px-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500' : 'sr-only'}>
            Person {i + 1}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor={`${idPrefix}-name-${person.id}`}>{i === 0 ? 'Client' : 'Name'}</Label>
              <SuggestInput<ClientSuggestion>
                id={`${idPrefix}-name-${person.id}`}
                required={firstRequired && i === 0}
                placeholder="Start typing a name"
                value={person.name}
                onChange={(name) => typed(person.id, { name })}
                onSelect={(c) => picked(person.id, c)}
                worth={isWorthFindingClient}
                suggest={suggestClients}
                keyOf={clientKey}
                renderItem={renderClient}
                listLabel="Matching contacts"
                footer={`From your CRM. Somebody new? Keep typing — ${filedBy} adds them.`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-email-${person.id}`}>Email</Label>
              <Input
                id={`${idPrefix}-email-${person.id}`}
                type="email"
                autoComplete="off"
                value={person.email}
                onChange={(e) => typed(person.id, { email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-phone-${person.id}`}>Phone</Label>
              <Input
                id={`${idPrefix}-phone-${person.id}`}
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="774-222-0952"
                value={person.phone}
                onChange={(e) => typed(person.id, { phone: formatPhoneInput(e.target.value) })}
              />
            </div>
            {several && (
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <button
                  type="button"
                  onClick={() => remove(person.id)}
                  aria-label={`Remove ${person.name.trim() || `person ${i + 1}`} from ${removeFrom}`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-red-700 hover:underline"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Remove
                </button>
              </div>
            )}
          </div>
          <div className="mt-2">
            <CrmLine person={person} filedBy={filedBy} />
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {people.length < MAX_PEOPLE && (
          <button
            type="button"
            onClick={() => onChange([...people, blankPerson()])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add another person
          </button>
        )}
        <p className="text-xs text-gray-500">{hint(several)}</p>
      </div>
    </div>
  );
};

export default PeopleFields;
