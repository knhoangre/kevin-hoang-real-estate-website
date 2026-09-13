/**
 * Phone input formatting.
 *
 * Lifted out of /contact, which had it as a private helper. The rental
 * application has eight phone fields across five sections; a ninth private copy
 * is how `formatPrice` ended up with two spellings of "Price on request".
 */

/**
 * Reformats as the user types: `7742220952` -> `774-222-0952`.
 *
 * Rebuilt from the raw digits on every keystroke rather than by inserting
 * characters at the cursor, which is what makes it idempotent (already-hyphenated
 * input round-trips), paste-safe (`(774) 222-0952` and `+1 774 222 0952` both
 * normalise), and correct on backspace with no special case for a trailing
 * separator.
 */
export const formatPhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/** True for an empty string or a complete 10-digit US number. Used by zod. */
export const isPhoneOrEmpty = (value: string) =>
  value.trim() === '' || value.replace(/\D/g, '').length === 10;

/** True only for a complete 10-digit US number. */
export const isPhone = (value: string) => value.replace(/\D/g, '').length === 10;
