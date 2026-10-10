/**
 * Assertions for src/lib/phone.ts.
 *
 *   node scripts/phone-check.ts
 *
 * Same arrangement as valuation-check.ts: Node runs the TypeScript directly, so
 * this imports the real formatter rather than a copy of it.
 *
 * It exists because the formatter's own comment claimed a pasted
 * "+1 774 222 0952" normalised, and for months it did not — the country code
 * was kept as the first digit and the last digit fell off the end, so the field
 * showed a different, plausible number. Nothing ran the claim.
 */
import { formatPhoneInput, isPhone, isPhoneOrEmpty, phoneDigits } from '../src/lib/phone.ts';

let failures = 0;
const is = (actual: unknown, expected: unknown, label: string) => {
  if (actual === expected) {
    console.log(`ok   ${label}`);
  } else {
    console.error(`FAIL ${label} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
    failures += 1;
  }
};

// What gets pasted: every one of these is the same number.
for (const pasted of [
  '+1 (203) 379-8682',
  '+12033798682',
  '1-203-379-8682',
  '1 (203) 379-8682',
  '(203) 379-8682',
  '203.379.8682',
  '203 379 8682',
  '2033798682',
  '203-379-8682',
  ' +1 203 379 8682 ',
]) {
  is(formatPhoneInput(pasted), '203-379-8682', `pasting "${pasted}" gives 203-379-8682`);
}

// What gets typed, one key at a time.
is(formatPhoneInput(''), '', 'an empty field stays empty');
is(formatPhoneInput('2'), '2', 'one digit');
is(formatPhoneInput('203'), '203', 'three digits, no hyphen yet');
is(formatPhoneInput('2033'), '203-3', 'the fourth digit brings the first hyphen');
is(formatPhoneInput('2033798'), '203-379-8', 'the seventh brings the second');
is(formatPhoneInput('203-379-86829'), '203-379-8682', 'an eleventh digit is dropped from the END');
is(formatPhoneInput('203-379-'), '203-379', 'backspacing over a hyphen does not get stuck');
is(formatPhoneInput('1'), '', 'a typed leading 1 is the country code, not a digit of the number');
is(formatPhoneInput('1203'), '203', 'and what follows it is the area code');
is(formatPhoneInput('+1'), '', '"+1" on its own is nothing yet');

// A 1 anywhere else is an ordinary digit.
is(formatPhoneInput('617-101-1111'), '617-101-1111', 'a 1 inside the number is kept');
is(formatPhoneInput(formatPhoneInput('+1 (203) 379-8682')), '203-379-8682', 'formatting twice changes nothing');

is(phoneDigits('+1 (203) 379-8682'), '2033798682', 'phoneDigits returns the ten digits');
is(isPhone('+1 (203) 379-8682'), true, 'a number pasted with +1 is a complete number');
is(isPhone('203-379-868'), false, 'nine digits is not');
is(isPhoneOrEmpty(''), true, 'empty is allowed where the phone is optional');
is(isPhoneOrEmpty('+1'), false, 'a bare country code is not a number');

console.log('');
if (failures > 0) {
  console.error(`${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('All assertions passed.');
