/**
 * Assertions for the email a contact form sends: what it says, where it says it
 * came from, and that what a stranger types cannot become HTML or a second
 * header line in Kevin's inbox.
 *
 *   node scripts/contact-email-check.ts [--html out.html]
 *
 * Runs the edge function's own module (Node 23+ type stripping). `--html` writes
 * one rendered email, to look at in a browser.
 */
import { writeFileSync } from 'node:fs';
import { contactEmail, pagePath, subjectFor, type ContactMessage } from '../supabase/functions/_shared/contactMessage.ts';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures += 1;
};

const base: ContactMessage = {
  firstName: 'Sam',
  lastName: 'Lee',
  email: 'sam@example.com',
  phone: '617-555-0123',
  message: "Hi Kevin,\nWe're thinking of selling next spring.\n\nThanks!",
  page: '/contact',
  zh: false,
};

console.log('--- the page it came from ---');
ok(pagePath('/contact') === '/contact', 'a plain path is kept');
ok(pagePath('/search/80-Gary-Rd-Newton-MA-02459-73568135') !== '', 'a listing path is kept');
ok(pagePath('https://evil.example/') === '', 'a URL is not a path');
ok(
  /href="https:\/\/(www\.)?kevinhoang\.co\/\/evil\.example"/.test(contactEmail({ ...base, page: pagePath('//evil.example') }).html),
  'a path that looks protocol-relative is still a link to this site'
);
ok(pagePath('/x"><script>') === '', 'markup is not a path');
ok(pagePath(42) === '', 'a number is not a path');
ok(pagePath('/' + 'a'.repeat(400)) === '', 'an over-long path is dropped');

console.log('--- the subject ---');
ok(subjectFor(base) === 'Website message from Sam Lee', 'a website message names the person');
ok(subjectFor({ ...base, page: '/search/12-Elm-St-73568135' }) === 'Question about a listing from Sam Lee', 'a listing page says so');
ok(subjectFor({ ...base, zh: true }) === 'Chinese pages: message from Sam Lee', 'the Chinese form says so');
ok(!/[\r\n]/.test(subjectFor({ ...base, lastName: 'Lee\r\nBcc: x@example.com' })), 'a name cannot add a header line');

console.log('--- the email ---');
const mail = contactEmail(base);
ok(mail.html.includes('From kevinhoang.co/contact'), 'the eyebrow names the page');
ok(mail.html.includes('<h1') && mail.html.includes('Sam Lee</h1>'), 'the heading is the person');
ok(mail.html.includes('selling next spring.<br><br>Thanks!'), "the message keeps its lines");
ok(mail.html.includes('href="tel:+16175550123"') && mail.html.includes('href="sms:+16175550123"'), 'Call and Text dial the number');
ok(mail.html.includes('mailto:sam@example.com'), 'Reply reaches the person');
ok(!/display:\s*flex|<style/.test(mail.html), 'no flexbox and no style block, which mail clients drop');
ok(mail.text.includes('Phone: 617-555-0123') && mail.text.includes("We're thinking"), 'the plain-text part carries everything');

const noPhone = contactEmail({ ...base, phone: '' });
ok(!noPhone.html.includes('tel:') && !noPhone.html.includes('>Phone<'), 'no phone, no phone row and no Call button');
const shortPhone = contactEmail({ ...base, phone: '555-0123' });
ok(shortPhone.html.includes('555-0123') && !shortPhone.html.includes('tel:'), 'a seven-digit phone is shown but not dialled');
const noPage = contactEmail({ ...base, page: '' });
ok(noPage.html.includes('From kevinhoang.co<') && !noPage.html.includes('Sent from'), 'no page, no "Sent from" row');

const zh = contactEmail({ ...base, zh: true, page: '/zh/lianxi' });
ok(zh.html.includes('From the Chinese pages'), 'the Chinese form says where it came from');
ok(zh.html.includes('Sent to Maggie Li and Kevin'), 'and that Maggie has it too');

const hostile = contactEmail({
  ...base,
  firstName: '<img src=x onerror=alert(1)>',
  message: '</div><a href="https://evil.example">click</a>',
  email: 'a"onmouseover="x@example.com',
});
ok(!hostile.html.includes('<img src=x') && hostile.html.includes('&lt;img src=x'), 'a name is escaped');
ok(!hostile.html.includes('<a href="https://evil.example"'), 'a message is escaped');
ok(!hostile.html.includes('a"onmouseover'), 'an email cannot break out of its attribute');

const out = process.argv.indexOf('--html');
if (out > 0 && process.argv[out + 1]) {
  writeFileSync(process.argv[out + 1], mail.html);
  console.log(`wrote ${process.argv[out + 1]}`);
}

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\ncontact-email-check: all pass');
