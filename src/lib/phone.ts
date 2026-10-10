/**
 * Phone input formatting.
 *
 * Lifted out of /contact, which had it as a private helper. The rental
 * application has eight phone fields across five sections; a ninth private copy
 * is how `formatPrice` ended up with two spellings of "Price on request".
 */

/**
 * The ten digits of a US number, however it was typed or pasted.
 *
 * A LEADING 1 IS THE COUNTRY CODE, NEVER PART OF THE NUMBER. No North American
 * area code begins with 1 (or 0), so the first digit being 1 always means
 * somebody wrote "+1 (203) 379-8682" or "1-203-…" — which is how a phone,
 * a CRM export and an email signature all hand a number over.
 *
 * Until 2026-10-09 the 1 was kept and the number cut to ten digits from the
 * front, so that paste became 120-337-9868: a real-looking number belonging to
 * nobody, with the last digit gone. The comment here claimed "+1 774 222 0952"
 * normalised; it did not, and nothing checked it.
 */
export const phoneDigits = (value: string): string =>
  value.replace(/\D/g, '').replace(/^1+/, '').slice(0, 10);

/**
 * Reformats as the user types: `7742220952` -> `774-222-0952`.
 *
 * Rebuilt from the raw digits on every keystroke rather than by inserting
 * characters at the cursor, which is what makes it idempotent (already-hyphenated
 * input round-trips), paste-safe (`(774) 222-0952` and `+1 774 222 0952` both
 * normalise — node scripts/phone-check.ts asserts it), and correct on backspace
 * with no special case for a trailing separator.
 *
 * A FIELD USING THIS MUST NOT ALSO SET `maxLength`. The browser applies
 * maxLength to pasted text BEFORE onChange runs, so with maxLength={12}
 * "+1 (203) 379-8682" reached this function as "+1 (203) 379" and the field
 * showed seven digits. Five fields had it until 2026-10-09. The ten-digit cap
 * here is the limit.
 */
export const formatPhoneInput = (value: string): string => {
  const digits = phoneDigits(value);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/** True for an empty string or a complete 10-digit US number. Used by zod. */
export const isPhoneOrEmpty = (value: string) =>
  value.trim() === '' || phoneDigits(value).length === 10;

/** True only for a complete 10-digit US number. */
export const isPhone = (value: string) => phoneDigits(value).length === 10;
