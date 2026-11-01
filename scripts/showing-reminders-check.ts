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
  clientSubject,
  clientsToConfirm,
  completion,
  reminderText,
  clientName,
  clockAt,
  digestEmail,
  greetingFor,
  notePhones,
  outcomesFrom,
  ownAddresses,
  parseIcs,
  shortAddress,
  stillToEmail,
  tourReminders,
  zillowChat,
  type LogRow,
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
  'https://calendar.google.com/calendar/ical/kevin.calendar%40example.com/private-0123abcd/basic.ics';
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
  'DESCRIPTION:Sarah cell: <b>(617) 555-0142</b><br>LA: jane@listingbroker.example\\, lockbox 1234',
  'ORGANIZER;CN=kevin.calendar@example.com:mailto:kevin.calendar@example.com',
  'ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=kevin.c',
  ' alendar@example.com:mailto:kevin.calendar@example.com',
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
  'UID:showingtime-77@showingtime.example',
  'SUMMARY:Showing: 40 Oak Ave',
  'ORGANIZER:mailto:appointments@showingtime.example',
  'ATTENDEE;PARTSTAT=ACCEPTED:mailto:kevin.calendar@example.com',
  'ATTENDEE;PARTSTAT=ACCEPTED:mailto:listing.agent@broker.example',
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
is(events[0].description.includes('jane@listingbroker.example, lockbox'), true, 'escaped commas are unescaped');
is(events[0].description.includes('<b>'), false, 'HTML in the notes is reduced to text');

const { reminders, problems } = calendarReminders(events, '2026-10-28', own);
is(
  reminders.map((r) => r.key),
  ['cal:zillow@google.com', 'cal:sarah@google.com', 'cal:showingtime-77@showingtime.example', 'cal:late@google.com'],
  "the 28th's four showings, in time order"
);
const [marcus, sarah, invite, late] = reminders;

// Sarah: Kevin's own event, Sarah a guest.
is(sarah.time, '2:00 PM', '18:00Z is 2:00 PM in Boston in October');
is(sarah.name, 'Sarah Lee', '"Showing - Sarah Lee" names Sarah Lee');
is(sarah.address, '12 Elm St, Newton', 'the address drops the state, ZIP and USA');
is(sarah.autoEmail, ['sarah@example.com'], 'only Sarah is emailed — not Kevin, not the room');
is(sarah.emails, ['jane@listingbroker.example'], "the listing agent in the notes is offered, never mailed");
is(sarah.phones, ['617-555-0142'], 'the number in the notes is found inside its HTML');
is(
  sarah.message,
  'Hi Sarah, just a friendly reminder about our showing today at 2:00 PM at 12 Elm St, Newton. Will you be able to make it?',
  'the message'
);

// Marcus: Zillow chat.
is(marcus.name, 'Marcus', '"Zillow showing w/ Marcus" names Marcus');
is(marcus.autoEmail.length + marcus.phones.length + marcus.emails.length, 0, 'a Zillow-chat lead has nothing to send to');

// The ShowingTime invitation.
is(invite.autoEmail, [], "nobody on somebody else's invitation is emailed");
is(invite.invitedBy, 'appointments@showingtime.example', 'and the reason is kept');
is(invite.time, '4:00 PM', 'a TZID=America/New_York time is read as written');
is(invite.name, null, 'a title that names only the house names nobody');
is(invite.address, '40 Oak Ave', 'and its address comes from the title');
is(invite.message.startsWith('Hi, just a friendly reminder'), true, 'a reminder with no name says "Hi,"');
is(
  reminderText({ greeting: 'Kevin', time: '6:00 PM', address: null, stops: 1 }),
  'Hi Kevin, just a friendly reminder about our showing today at 6:00 PM. Will you be able to make it?',
  'with no address on the event it reads exactly as Kevin worded it'
);
{
  const email = clientEmail(sarah);
  is(email.text.includes('Will you be able to make it?'), true, 'the email asks the same question');
  is(email.html.includes('Will you be able to make it?'), true, 'in both its forms');
  is(/See you there/.test(email.text + email.html), false, 'and does not then assume the answer');
}

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
is([...ownAddresses(CAL_URL)].includes('kevin.calendar@example.com'), true, "the calendar's own address is Kevin's");

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
  'Hi Tammy and Matthew, just a friendly reminder about our showings today. We start at 10:00 AM at 3 Maple St, Newton. Will you be able to make it?',
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

// The Zillow chat in an event's notes.
const CHAT = 'https://www.zillow.com/agent-hub/inbox/conversations/2094857361?x=1&y=2';
const zillowEvents = parseIcs(
  [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'DTSTART:20261028T140000Z',
    'UID:bare@google.com',
    'SUMMARY:Showing - Bare Link',
    `DESCRIPTION:Chat: ${CHAT}`,
    'END:VEVENT',
    'BEGIN:VEVENT',
    'DTSTART:20261028T150000Z',
    'UID:worded@google.com',
    'SUMMARY:Showing - Worded Link',
    // A link with words on it, folded across two lines, its & written as HTML.
    'DESCRIPTION:<a href="https://www.zillow.com/agent-hub/inbox/conversations/20948',
    ' 57361?x=1&amp\;y=2">Zillow chat</a>\, call (617) 555-0142',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'DTSTART:20261028T160000Z',
    'UID:none@google.com',
    'SUMMARY:Showing - No Link',
    'DESCRIPTION:Nothing here',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
);
const withChat = calendarReminders(zillowEvents, '2026-10-28', own).reminders;
is(withChat[0].zillow, CHAT, "a link pasted into the notes is that showing's Zillow chat");
is(withChat[1].zillow, CHAT, 'and so is one with words on it, in Google’s rich text');
is(withChat[2].zillow, null, 'an event with no link has no chat');
is(withChat[0].noteLinks, ['www.zillow.com/agent-hub'], 'the dry run sees where a link goes, and not the conversation');
is(withChat[0].phones, [], 'a ten-digit conversation id in a link is not a phone number');
is(withChat[1].phones, ['617-555-0142'], 'and a real number beside the link is still found');
is(tourReminders([{ id: 't', tour_date: '2026-10-28', clients: [], showing_tour_stops: [{ starts_at: '10:00:00', address: '1 A St', town: null, state: null }] }], '2026-10-28')[0].zillow, null, 'a tour has no chat');

for (const [links, expected, label] of [
  [['https://www.zillow.com/inbox/1'], 'https://www.zillow.com/inbox/1', 'www.zillow.com'],
  [['https://premieragent.zillow.com/crm/1'], 'https://premieragent.zillow.com/crm/1', 'a Zillow subdomain'],
  [['zillow.com/inbox/1'], 'https://zillow.com/inbox/1', 'a link typed with no https'],
  [['http://www.zillow.com/inbox/1'], 'https://www.zillow.com/inbox/1', 'http is made https'],
  [['https://www.google.com/url?q=https%3A%2F%2Fwww.zillow.com%2Finbox%2F1&sa=D'], 'https://www.zillow.com/inbox/1', "behind Google's redirect"],
  [['https://www.zillow.com/homedetails/12-Elm-St/123_zpid/', 'https://www.zillow.com/inbox/1'], 'https://www.zillow.com/inbox/1', 'the chat, not the listing beside it'],
  [['https://www.zillow.com/homedetails/12-Elm-St/123_zpid/'], null, "a listing's page is not a chat"],
  [['https://zillow.com.evil.example/inbox/1'], null, 'a look-alike address is refused'],
  [['https://notzillow.com/inbox/1'], null, 'so is one that only ends the same'],
  [['https://www.google.com/url?q=https%3A%2F%2Fevil.example%2Fx'], null, "and anything else behind Google's redirect"],
  [['javascript:alert(1)//zillow.com/x'], null, 'a script is not a link'],
] as const) {
  is(zillowChat([...links]), expected, `zillowChat: ${label}`);
}

// Tomorrow's list says tomorrow.
is(
  reminderText({ greeting: 'Kevin', time: '6:00 PM', address: null, stops: 1 }, 'tomorrow'),
  'Hi Kevin, just a friendly reminder about our showing tomorrow at 6:00 PM. Will you be able to make it?',
  'a message sent the night before says tomorrow'
);
is(clientSubject({ stops: 1, time: '6:00 PM' }, 'tomorrow'), 'Reminder: our showing tomorrow at 6:00 PM', 'and so does its subject');

// Completed: what keeps a client from being messaged twice.
const log = (kind: string, key: string, over: Partial<LogRow> = {}): LogRow => ({
  kind,
  source_key: key,
  recipients: [],
  sent_at: '2026-10-28T12:00:00Z',
  error: null,
  how: null,
  ...over,
});
const emailed = log('client', sarah.key, { recipients: ['sarah@example.com'] });
const failed = log('client', sarah.key, { recipients: ['sarah@example.com'], sent_at: null, error: 'refused' });
const pressed = log('done', sarah.key, { how: 'zillow', sent_at: '2026-10-28T13:00:00Z' });

is(completion([], sarah.key), null, 'nothing sent is not completed');
is(completion([failed], sarah.key), null, 'an email that failed is not completed');
is(completion([emailed], sarah.key)?.how, 'emailed', 'the 8 AM email going completes it');
is(completion([emailed], sarah.key)?.undoable, false, 'and an email that went cannot be undone');
is(completion([pressed], sarah.key)?.how, 'zillow', 'so does opening the Zillow chat');
is(completion([pressed], sarah.key)?.undoable, true, 'which can be');
is(completion([emailed, pressed], sarah.key)?.how, 'zillow', "Kevin's own word comes first");
is(completion([pressed], marcus.key), null, 'one showing being completed says nothing about another');
is(completion([log('done', sarah.key, { how: 'smoke-signal' })], sarah.key)?.how, 'other', 'a way it does not know is still completed');
is(completion([log('digest', 'digest')], 'digest'), null, "Kevin's summary is nobody's reminder");

is(stillToEmail([sarah, late], []).map((r) => r.key), [sarah.key, late.key], 'at 8 every guest is emailed');
is(stillToEmail([sarah, late], [pressed]).map((r) => r.key), [late.key], 'but not one Kevin already completed');
is(stillToEmail([sarah, late], [failed]).map((r) => r.key), [sarah.key, late.key], 'a failed email does not count against a second try, whose claim decides');
is(stillToEmail([marcus], []).length, 0, 'and nobody with no address');

// The number on the Showings tile, in the profile menu and on his picture.
const at = (time: string) => ({ time, hour: Number(time.slice(0, 2)) });
const showing = (key: string, over: Partial<Reminder> = {}): Reminder => ({
  ...marcus,
  key,
  name: key,
  startsAt: '15:00',
  autoEmail: [],
  ...over,
});
const done = (key: string) => log('done', key, { how: 'text', sent_at: '2026-10-28T13:00:00Z' });

is(clientsToConfirm([], [], at('09:00')), 0, 'no showings, no number');
is(clientsToConfirm([showing('a'), showing('b')], [], at('09:00')), 2, 'two clients are two');
is(clientsToConfirm([showing('a'), showing('b')], [done('a')], at('09:00')), 1, 'one Kevin has sent is off the count');
is(clientsToConfirm([showing('a'), showing('b')], [done('a'), done('b')], at('09:00')), 0, 'and the number goes away with the last');

const sameClient = [showing('h1', { name: 'Sarah Lee' }), showing('h2', { name: 'sarah lee', startsAt: '16:00' })];
is(clientsToConfirm(sameClient, [], at('09:00')), 1, 'two homes with one client is one person to confirm with');
is(clientsToConfirm(sameClient, [done('h1')], at('09:00')), 1, 'who stays on the count until both are done');
is(clientsToConfirm(sameClient, [done('h1'), done('h2')], at('09:00')), 0, 'and then comes off');
is(clientsToConfirm([showing('x', { name: null }), showing('y', { name: null })], [], at('09:00')), 2, 'a showing with no name is its own client');

is(clientsToConfirm([showing('a')], [], at('14:59')), 1, 'it counts up to its start');
is(clientsToConfirm([showing('a')], [], at('15:00')), 0, 'and not once it has started');
is(clientsToConfirm([showing('a')], [], at('21:00')), 0, 'so a morning showing is not still up that night');

const guest = showing('g', { autoEmail: ['sarah@example.com'] });
is(clientsToConfirm([guest], [], at('07:30')), 0, 'before 8 a guest is left to the morning email');
is(clientsToConfirm([guest, showing('a')], [], at('07:30')), 1, 'while a client with no email already counts');
is(clientsToConfirm([guest], [log('client', 'g', { recipients: ['sarah@example.com'] })], at('09:00')), 0, 'the morning email going completes it');
is(clientsToConfirm([guest], [log('client', 'g', { sent_at: null, error: 'refused' })], at('09:00')), 1, 'an email that failed puts it back on him');
is(clientsToConfirm([guest], [], at('09:00')), 1, 'and so does a guest added after 8, which nothing will email');

const doneDigest = digestEmail('2026-10-28', [sarah, marcus], outcomesFrom([pressed]), []);
is(doneDigest.text.includes('Already completed.'), true, 'the morning email says one is already done');
is(doneDigest.text.includes(sarah.message), false, 'and does not write its message out again');
is(doneDigest.html.includes(sarah.message), false, 'in either form');
is(doneDigest.text.includes(marcus.message), true, 'the others still have theirs');
is(/sms:|mailto:/.test(digest.html), false, 'the morning email has no send links: a text from there would never say Completed');
is(digest.html.includes('/admin/showings'), true, 'it sends him to the page instead');

const chatDigest = digestEmail('2026-10-28', [withChat[0]], new Map(), []);
is(chatDigest.text.includes('Zillow chat'), true, 'a showing with a chat says to send it there');
is(chatDigest.text.includes('paste the message there'), false, 'and is not told it has no way to be reached');

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll checks passed.');
