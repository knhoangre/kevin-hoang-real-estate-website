/**
 * Money input formatting for the CRM forms.
 *
 * The house-price field used to be `<input type="number">`, which shows
 * `850000` with no separators — at six and seven figures that is genuinely hard
 * to read back, and a mistyped digit is invisible. These keep the *state* as a
 * plain numeric string and only format for display, so nothing has to parse a
 * comma back out on save.
 */

/** Strip everything that is not a digit or a single decimal point. */
export const digitsOnly = (raw: string) => {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
};

/** `"850000"` -> `"850,000"`. Grouping appears as soon as there are 4 digits. */
export const groupThousands = (raw: string) => {
  if (!raw) return '';
  const [whole, fraction] = raw.split('.');
  const grouped = whole ? Number(whole).toLocaleString('en-US') : '';
  // A trailing "." while the user is still typing must survive the round trip.
  if (fraction === undefined) return raw.endsWith('.') ? `${grouped}.` : grouped;
  return `${grouped}.${fraction}`;
};

export const formatCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
