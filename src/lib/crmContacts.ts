import { supabase } from '@/integrations/supabase/client';

/**
 * Creating one contact, for callers outside the contacts page.
 *
 * The contacts schema is normalised: first names, last names, emails, phones
 * and sources each live in their own table and `contacts` joins them by id. So
 * "add a contact" is really five get-or-create round trips, and that logic was
 * written out twice already inside CRMContacts (once for the manual form, once
 * for the CSV import). This is the third caller — the New Deal dialog — so it
 * lives here rather than being pasted a third time.
 *
 * Returns the new `contacts.id`, which is what `contacts_view.contact_id`
 * exposes and what `deals.contact_id` points at.
 */

/** Matches the formatting the contacts page applies, so lookups hit the same row. */
export const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10
    ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    : raw.trim();
};

/**
 * Look a value up in one of the lookup tables, inserting it if it is not there.
 * `.single()` reports "no rows" as an error rather than throwing, which is why
 * only `data` is inspected on the read.
 */
const getOrCreate = async (table: string, column: string, value: string) => {
  const { data: existing } = await supabase
    .from(table as never)
    .select('id')
    .eq(column, value)
    .maybeSingle();
  if (existing) return (existing as { id: number }).id;

  const { data: created, error } = await supabase
    .from(table as never)
    .insert({ [column]: value } as never)
    .select('id')
    .single();
  if (error) {
    // A concurrent insert can win the unique constraint between our read and
    // our write. Re-read rather than surfacing a duplicate-key error.
    const { data: retry } = await supabase
      .from(table as never)
      .select('id')
      .eq(column, value)
      .maybeSingle();
    if (retry) return (retry as { id: number }).id;
    throw error;
  }
  return (created as { id: number }).id;
};

export interface NewContactInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  /** Defaults to "Deal" — where the record came from, for later filtering. */
  source?: string;
}

export const createContact = async (input: NewContactInput): Promise<number> => {
  const firstName = input.first_name.trim();
  const lastName = input.last_name.trim();
  const email = input.email?.trim() || '';
  const phone = input.phone?.trim() ? formatPhone(input.phone) : '';

  if (!firstName || !lastName) throw new Error('First and last name are required');
  // The contacts table treats a record with neither as unreachable, and the
  // CSV importer rejects it for the same reason.
  if (!email && !phone) throw new Error('Enter an email or a phone number');

  const firstNameId = await getOrCreate('contact_first_names', 'first_name', firstName);
  const lastNameId = await getOrCreate('contact_last_names', 'last_name', lastName);
  const emailId = email ? await getOrCreate('contact_emails', 'email', email) : null;
  const phoneId = phone ? await getOrCreate('contact_phones', 'phone', phone) : null;
  const sourceId = await getOrCreate('contact_sources', 'source', input.source?.trim() || 'Deal');

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      first_name_id: firstNameId,
      last_name_id: lastNameId,
      email_id: emailId,
      phone_id: phoneId,
      source_id: sourceId,
      is_active: true,
    } as never)
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: number }).id;
};
