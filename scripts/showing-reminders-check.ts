/**
 * Assertions for supabase/functions/_shared/showingReminders.ts — which events
 * on Kevin's calendar become a morning-of reminder, who is emailed, and what
 * the message says.
 *
 *   node scripts/showing-reminders-check.ts
 *
 * Node runs the TypeScript directly (type stripping, Node 23+), so this imports
 * the module the edge function runs rather than a copy of it.
 *
 * The calendar below is written the way Google exports one: one-off events in
 * UTC, folded lines, escaped commas, HTML in the notes, the organizer listed as
 * a guest. Each event has one right answer, and the two that matter most are
 * about who is NOT emailed — the listing agent in the notes, and the guests on
 * somebody else's invitation.
 */
import {
  addDays,
  bostonClock,
  calendarReminders,
  clientEmail,
  clientName,
  clockAt,
  digestEmail,
  greetingFor,
  notePhones,
  ownAddresses,
  parseIcs,
  shortAddress,
  tourReminders,
  type Outcome,
  type Reminder,
} from '../supabase/functions/_shared/showingReminders.ts';

let failures = 0;
const is = (actual: unknown, expected: unknown, label: string) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`ok   ${label}`);
  } else {
    console.error(`FAIL ${label} (got ${a}, expected ${e})`);
    failures += 1;
  }
};

const CAL_URL =
  'https://calendar.google.com/calendar/ical/kevin.cal%40gmail.com/private-0123abcd/basic.ics';
const own = ownAddresses(CAL_URL);

const ics = [
  'BEGIN:VCALENDAR',
  'PRODID:-//Google Inc//Google Calendar 70.9054//EN',
  'VERSION:2.0',
  'X-WR-TIMEZONE:America/New_York',
  // Kevin's own event, the client a guest, the listing agent's email in the notes.
  'BEGIN:VEVENT',
  'DTSTART:20261028T180000Z',
  'UID:sarah@google.com',
  'SUMMARY:Showing - Sarah Lee',
  'LOCATION:12 Elm St\\, Newton\\, MA 02459\\, USA',
  'DESCRIPTION:Sarah cell: <b>(617) 555-0142</b><br>LA: jane@listingbroker.com\\, lockbox 1234',
  'ORGANIZER;CN=kevin.cal@gmail.com:mailto:kevin.cal@gmail.com',
  'ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=kevin.c',
  ' al@gmail.com:mailto:kevin.cal@gmail.com',
  'ATTENDEE;CUTYPE=INDIVIDUAL;PARTSTAT=NEEDS-ACTION;CN="Lee, Sarah":mailto:Sara',
  ' h@Example.com',
  'ATTENDEE;CUTYPE=RESOURCE;CN=Room:mailto:c_123@resource.calendar.google.com',
  'BEGIN:VALARM',
  'ACTION:DISPLAY',
  'DESCRIPTION:This is an event reminder',
  'END:VALARM',
  'END:VEVENT',
  // A Zillow-chat lead: a name and nothing to reach them by. Earlier in the day.
  'BEGIN:VEVENT',
  'DTSTART:20261028T140000Z',
  'UID:zillow@google.com',
  'SUMMARY:Zillow showing w/ Marcus',
  'LOCATION:88 Chestnut St\\, Needham\\, MA 02492',
  'END:VEVENT',
  // Somebody else's invitation: its guests are not Kevin's clients.
  'BEGIN:VEVENT',
  'DTSTART;TZID=America/New_York:20261028T160000',
  'UID:showingtime-77@showingtime.com',
  'SUMMARY:Showing: 40 Oak Ave',
  'ORGANIZER:mailto:appointments@showingtime.com',
  'ATTENDEE;PARTSTAT=ACCEPTED:mailto:kevin.cal@gmail.com',
  'ATTENDEE;PARTSTAT=ACCEPTED:mailto:listing.agent@broker.com',
  'END:VEVENT',
  // 9:30 PM in Boston is the NEXT day in UTC; it is still the 28th's.
  'BEGIN:VEVENT',
  'DTSTART:20261029T013000Z',
  'UID:late@google.com',
  'SUMMARY:Ana & Tom showing',
  'LOCATION:5 Pine Rd\\, Wellesley\\, MA',
  'ATTENDEE;PARTSTAT=DECLINED:mailto:tom@example.com',
  'ATTENDEE;PARTSTAT=ACCEPTED:mailto:ana@example.com',
  'END:VEVENT',
  // Not reminded: cancelled, repeating, a tour stop, all-day, another day, not a showing.
  'BEGIN:VEVENT',
  'DTSTART:20261028T170000Z',
  'UID:cancelled@google.com',
  'STATUS:CANCELLED',
  'SUMMARY:Showing - Cancelled Person',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;TZID=America/New_York:20261007T090000',
  'RRULE:FREQ=WEEKLY;BYDAY=WE',
  'UID:weekly@google.com',
  'SUMMARY:Weekly showing review',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;TZID=America/New_York:20261028T100000',
  'UID:3f2a-0@kevinhoang.co',
  'SUMMARY:Showing: 9 Birch Ln\\, Newton\\, MA 02459',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20261028',
  'UID:allday@google.com',
  'SUMMARY:Showing - All Day Person',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART:20261029T150000Z',
  'UID:tomorrow@google.com',
  'SUMMARY:Showing - Tomorrow Person',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART:20261028T200000Z',
  'UID:dentist@google.com',
  'SUMMARY:Dentist',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

const events = parseIcs(ics);
is(events.length, 10, 'every VEVENT is read, and the alarm inside one is not an eleventh');
is(events[0].description.includes('jane@listingbroker.com, lockbox'), true, 'escaped commas are unescaped');
is(events[0].description.includes('<b>'), false, 'HTML in the notes is reduced to text');

const { reminders, problems } = calendarReminders(events, '2026-10-28', own);
is(
  reminders.map((r) => r.key),
  ['cal:zillow@google.com', 'cal:sarah@google.com', 'cal:showingtime-77@showingtime.com', 'cal:late@google.com'],
  "the 28th's four showings, in time order"
);
const [marcus, sarah, invite, late] = reminders;

// Sarah: Kevin's own event, Sarah a guest.
is(sarah.time, '2:00 PM', '18:00Z is 2:00 PM in Boston in October');
is(sarah.name, 'Sarah Lee', '"Showing - Sarah Lee" names Sarah Lee');
is(sarah.address, '12 Elm St, Newton', 'the address drops the state, ZIP and USA');
is(sarah.autoEmail, ['sarah@example.com'], 'only Sarah is emailed — not Kevin, not the room');
is(sarah.emails, ['jane@listingbroker.com'], "the listing agent in the notes is offered, never mailed");
is(sarah.phones, ['617-555-0142'], 'the number in the notes is found inside its HTML');
is(
  sarah.message,
  'Hi Sarah, just a friendly reminder about our showing today at 2:00 PM at 12 Elm St, Newton. See you there! – Kevin',
  'the message'
);

// Marcus: Zillow chat.
is(marcus.name, 'Marcus', '"Zillow showing w/ Marcus" names Marcus');
is(marcus.autoEmail.length + marcus.phones.length + marcus.emails.length, 0, 'a Zillow-chat lead has nothing to send to');

// The ShowingTime invitation.
is(invite.autoEmail, [], "nobody on somebody else's invitation is emailed");
is(invite.invitedBy, 'appointments@showingtime.com', 'and the reason is kept');
is(invite.time, '4:00 PM', 'a TZID=America/New_York time is read as written');
is(invite.name, null, 'a title that names only the house names nobody');
is(invite.address, '40 Oak Ave', 'and its address comes from the title');
is(invite.message.startsWith('Hi, just a friendly reminder'), true, 'a reminder with no name says "Hi,"');

// Late evening, two people, one declined.
is(late.time, '9:30 PM', 'a 9:30 PM showing is on its own day, not the next');
is(late.greeting, 'Ana and Tom', 'two people are greeted by first name');
is(late.autoEmail, ['ana@example.com'], 'a guest who declined is not emailed');

is(problems, ['"Showing - All Day Person" is an all-day event, so there is no time to remind about.'], 'the all-day showing is reported, the rest skipped quietly');

// The next day, from the same file.
is(calendarReminders(events, '2026-10-29', own).reminders.map((r) => r.name), ['Tomorrow Person'], "the 29th's showing, and not the 28th's late one");

// Time.
is(bostonClock({ value: '20261101T150000Z', tzid: null, dateOnly: false }), { day: '2026-11-01', time: '10:00' }, 'after the clocks go back on Nov 1, 15:00Z is 10 AM');
is(bostonClock({ value: '20261031T140000Z', tzid: null, dateOnly: false }), { day: '2026-10-31', time: '10:00' }, 'and the day before, 14:00Z is 10 AM');
is(bostonClock({ value: '20261028T110000', tzid: 'America/Los_Angeles', dateOnly: false }), { day: '2026-10-28', time: '14:00' }, 'a Pacific time is converted');
is(bostonClock({ value: '20261028T140000', tzid: 'Eastern Standard Time', dateOnly: false }), { day: '2026-10-28', time: '14:00' }, "Outlook's zone name is understood");
is(bostonClock({ value: '20261028T140000', tzid: 'Nowhere/Special', dateOnly: false }), null, 'an unknown zone is unreadable, not a guess');
is(clockAt(Date.UTC(2026, 9, 28, 12, 0)).hour, 8, '12:00 UTC is 8 AM in Boston in summer time');
is(clockAt(Date.UTC(2026, 10, 2, 13, 0)).hour, 8, '13:00 UTC is 8 AM in Boston in winter');
is(addDays('2026-10-31', 1), '2026-11-01', 'tomorrow across a month');

// Names, greetings, addresses, numbers.
for (const [title, name] of [
  ['Showing - Sarah Lee', 'Sarah Lee'],
  ['Sarah Lee showing', 'Sarah Lee'],
  ['Showing: Sarah', 'Sarah'],
  ['Showing with Mary-Jane Smith', 'Mary-Jane Smith'],
  ['Showing for the Nguyens – 12 Elm St', 'the Nguyens'],
  ['Showing - 12 Elm St - Sarah', 'Sarah'],
  ['Showing: 12 Elm St', null],
  ['Showing', null],
] as const) {
  is(clientName(title), name, `"${title}" → ${JSON.stringify(name)}`);
}
is(greetingFor(['Sarah Lee']), 'Sarah', 'one person, first name');
is(greetingFor(['Tammy Ng', 'Matthew Ng', 'Sam']), 'Tammy, Matthew and Sam', 'three people');
is(shortAddress('Starbucks'), 'Starbucks', 'a place is left alone');
is(shortAddress('12 Elm St #3, Newton, MA 02459-1234'), '12 Elm St #3, Newton', 'a unit stays, a ZIP+4 goes');
for (const typed of ['(617) 555-0142', '617.555.0142', '+1 617 555 0142', '6175550142', '1-617-555-0142']) {
  is(notePhones(`call ${typed} today`), ['617-555-0142'], `"${typed}" is 617-555-0142`);
}
is(notePhones('MLS 73568135, lockbox 1234, order 1234567890'), [], 'an MLS number, a code, or a number with a 1 area code is not a phone');
is([...ownAddresses(CAL_URL)].includes('kevin.cal@gmail.com'), true, "the calendar's own address is Kevin's");

// A showing tour.
const tours = tourReminders(
  [
    {
      id: 'aa01',
      tour_date: '2026-10-28',
      clients: [
        { name: 'Tammy Ng', email: 'Tammy@Example.com', phone: '617 555 0199' },
        { name: 'Matthew Ng', email: null, phone: null },
      ],
      showing_tour_stops: [
        { starts_at: '11:30:00', address: '9 Birch Ln', town: 'Newton', state: 'MA' },
        { starts_at: '10:00:00', address: '3 Maple St', town: 'Newton', state: 'MA' },
      ],
    },
    { id: 'aa02', tour_date: '2026-10-29', clients: [], showing_tour_stops: [] },
  ],
  '2026-10-28'
);
is(tours.length, 1, "only the day's tour, and only one with stops");
is(tours[0].time, '10:00 AM', 'a tour starts at its earliest stop');
is(tours[0].autoEmail, ['tammy@example.com'], 'the tour people with an email are emailed');
is(tours[0].phones, ['617-555-0199'], 'and their phones are offered');
is(
  tours[0].message,
  'Hi Tammy and Matthew, just a friendly reminder about our showings today. We start at 10:00 AM at 3 Maple St, Newton. See you there! – Kevin',
  'the tour message'
);

// Nothing rendered may print a blank.
const all: Reminder[] = [...reminders, ...tours];
const outcomes = new Map<string, Outcome>([
  [sarah.key, { sentTo: ['sarah@example.com'], error: null }],
  [late.key, { sentTo: [], error: 'refused' }],
]);
const rendered = [
  ...all.flatMap((r) => {
    const email = clientEmail(r);
    return [r.message, email.subject, email.text, email.html];
  }),
  ...Object.values(digestEmail('2026-10-28', all, outcomes, problems)),
  ...Object.values(digestEmail('2026-10-28', [], new Map(), ['Google Calendar answered 404.'])),
];
is(
  rendered.filter((text) => /undefined|NaN|null|\[object/.test(text)).length,
  0,
  'no message, email or morning summary prints undefined, NaN or null'
);
const digest = digestEmail('2026-10-28', all, outcomes, problems);
is(digest.subject, "Today's showings: 5 reminders", 'the morning email counts the reminders');
is(digest.text.includes('Emailed sarah@example.com.'), true, 'and says who was emailed');
is(digest.text.includes("Couldn't email ana@example.com"), true, 'and whose email failed');
is(digest.text.includes('paste the message there'), true, 'and what to do for a Zillow chat');
is(clientEmail(sarah).html.includes('LPT Realty'), true, 'the client email names the brokerage');

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll checks passed.');
