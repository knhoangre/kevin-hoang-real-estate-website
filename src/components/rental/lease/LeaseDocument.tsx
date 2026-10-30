import type { ReactNode } from 'react';
import {
  formatLeaseDate,
  formatMoney,
  leasePremises,
  moneyValue,
  moveInLines,
  moveInTotal,
  ordinalDay,
  PAYER_LABEL,
  showMoney,
  termMonths,
  UTILITIES,
  type LeaseDoc,
} from '@/lib/lease';
import { formatProperty } from '@/lib/rentalProperty';
import { sentenceList } from '@/lib/utils';

/**
 * The lease as it prints, drawn inside the lease's DocFrame with lease.css.
 *
 * NUMBERED SECTIONS FROM THE FIELDS, THEN THE LEASE'S OWN CLAUSES. The first
 * sections set the fields out in sentences — who, where, how long, how much —
 * and appear only when they have something to say (no vehicles, no Vehicles
 * section). Then the clauses, which are the lease's own text, copied in when it
 * was made and edited in it (see lease.ts). Numbering runs through both.
 *
 * A FIELD NOBODY HAS FILLED IN PRINTS AS A LINE TO WRITE ON, never as a guess
 * and never as nothing: a lease with "the Landlord, ________" can still be
 * completed by hand at the table, while one that silently omits the landlord
 * reads as finished.
 *
 * The legal sentences in "Money at the start" are not choices. Each follows
 * G.L. c.186 §15B, and each appears only when the money it is about is asked
 * for — the deposit's account, receipt, interest, statement of condition and
 * return only with a deposit.
 */

const Blank = ({ short }: { short?: boolean }) => (
  <span className={short ? 'ls-blank ls-short' : 'ls-blank'} aria-label="blank" />
);

/** The value, or a line to write it on. */
const fill = (value: string, short?: boolean): ReactNode => (value.trim() ? value.trim() : <Blank short={short} />);

const lines = (text: string): string[] =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/** One line set inside a sentence, without a full stop of its own to double up. */
const bare = (line: string): string => line.replace(/[.;,\s]+$/, '');

/** A free-text field as a list when it has several lines, a sentence when it has one. */
const listOrLine = (text: string): ReactNode => {
  const items = lines(text);
  if (items.length <= 1) return items[0] ?? '';
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
};

const Section = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <section className="ls-section">
    <h2>
      <span className="ls-n">{n}.</span>
      {title}
    </h2>
    {children}
  </section>
);

const LeaseDocument = ({ doc }: { doc: LeaseDoc }) => {
  const address = formatProperty(leasePremises(doc)).replace(' · ', ', ');
  const tenants = doc.tenants.filter((t) => t.name.trim());
  const named = tenants.map((t) => t.name.trim());
  const months = doc.start && doc.end ? termMonths(doc.start, doc.end) : null;
  const total = moveInTotal(doc);
  const moneyIn = moveInLines(doc);
  const lastPaid = (moneyValue(doc.lastMonth) ?? 0) > 0;
  const deposit = (moneyValue(doc.security) ?? 0) > 0;
  const occupants = lines(doc.occupants);
  const pets = lines(doc.pets);
  const agent = doc.agent;

  const sections: { title: string; body: ReactNode }[] = [];

  sections.push({
    title: 'The parties',
    body: (
      <>
        <p>
          This lease is made between {fill(doc.landlord.name)} (the “Landlord”)
          {doc.landlord.address.trim() ? (
            <>, whose address for notices is {doc.landlord.address.trim().replace(/\n+/g, ', ')}</>
          ) : (
            <>
              , whose address for notices is <Blank />
            </>
          )}
          , and {named.length > 0 ? sentenceList(named) : <Blank />} (together, the “Tenant”).
        </p>
        {(doc.landlord.phone.trim() || doc.landlord.email.trim()) && (
          <p>
            The Landlord may be reached at{' '}
            {sentenceList([doc.landlord.phone.trim(), doc.landlord.email.trim()].filter(Boolean))}.
          </p>
        )}
        {tenants.some((t) => t.phone.trim() || t.email.trim()) && (
          <table className="ls-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>{t.name.trim()}</td>
                  <td>{t.phone.trim()}</td>
                  <td>{t.email.trim()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    ),
  });

  sections.push({
    title: 'The premises',
    body: (
      <>
        <p>
          The Landlord leases to the Tenant the home at {address || <Blank />} (the “premises”).
        </p>
        {lines(doc.includes).length === 1 && <p>Included with the premises: {bare(lines(doc.includes)[0])}.</p>}
        {lines(doc.includes).length > 1 && (
          <>
            <p>Included with the premises:</p>
            {listOrLine(doc.includes)}
          </>
        )}
      </>
    ),
  });

  sections.push({
    title: 'Term',
    body: (
      <p>
        The lease begins on {doc.start ? formatLeaseDate(doc.start) : <Blank />} and ends on{' '}
        {doc.end ? formatLeaseDate(doc.end) : <Blank />}
        {months ? `, a term of ${months} ${months === 1 ? 'month' : 'months'}` : ''}.
      </p>
    ),
  });

  sections.push({
    title: 'Rent',
    body: (
      <>
        <p>
          The rent is {doc.rent.trim() ? showMoney(doc.rent) : <Blank short />} a month, paid in advance on the{' '}
          {doc.dueDay.trim() ? ordinalDay(doc.dueDay) : <Blank short />} day of each month to {fill(doc.payTo)}
          {doc.payHow.trim() ? `, by ${doc.payHow.trim()}` : ''}.
        </p>
        {doc.lateFee.trim() && (
          <p>
            If rent is still unpaid thirty days after it is due, a late charge of {showMoney(doc.lateFee)} is due.
            No late charge or interest is due before then.
          </p>
        )}
      </>
    ),
  });

  sections.push({
    title: 'Money at the start',
    body:
      total === null ? (
        <p>No money is due before the tenancy begins.</p>
      ) : (
        <>
          <p>Before the tenancy begins the Tenant pays:</p>
          <table className="ls-table">
            <tbody>
              {moneyIn.map((line) => (
                <tr key={line.label}>
                  <td>{line.label}</td>
                  <td className="ls-amount">{formatMoney(line.amount)}</td>
                </tr>
              ))}
              {moneyIn.length > 1 && (
                <tr className="ls-total">
                  <td>Total</td>
                  <td className="ls-amount">{formatMoney(total)}</td>
                </tr>
              )}
            </tbody>
          </table>
          <p>The Landlord requires no other payment at or before the start of the tenancy.</p>
          {lastPaid && (
            <p>
              Last month’s rent paid in advance earns interest at five percent a year, or the lower rate earned
              where it is held, from the first day of the tenancy. The interest is paid to the Tenant each
              year. The Tenant should give the Landlord a forwarding address at the end of the tenancy.
            </p>
          )}
          {deposit && (
            <p>
              The security deposit will be held in a separate, interest-bearing account in a bank in
              Massachusetts. Within thirty days of receiving it the Landlord will give the Tenant a receipt
              naming the bank and its location, the account number and the amount. The deposit earns interest
              at five percent a year, or the lower rate the bank pays, paid to the Tenant at the end of each
              year of the tenancy. When the deposit is received, or within ten days after the tenancy begins
              if that is later, the Landlord will give the Tenant a written statement of the condition of the
              premises. Within thirty days after the tenancy ends the Landlord will return the deposit, with
              any interest due, less only the deductions the law allows, each listed in writing.
            </p>
          )}
        </>
      ),
  });

  sections.push({
    title: 'Who lives there',
    body: (
      <>
        <p>
          The premises will be lived in only by the Tenant
          {occupants.length === 0 ? '.' : occupants.length === 1 ? ` and ${bare(occupants[0])}.` : ' and:'}
        </p>
        {occupants.length > 1 && listOrLine(doc.occupants)}
        {named.length > 1 && (
          <p>
            Each person named as Tenant is responsible for the whole rent and for every obligation of this
            lease, not only a share of it.
          </p>
        )}
      </>
    ),
  });

  sections.push({
    title: 'Utilities and services',
    body: (
      <table className="ls-table">
        <thead>
          <tr>
            <th>Utility or service</th>
            <th>Paid for by</th>
          </tr>
        </thead>
        <tbody>
          {UTILITIES.map((u) => {
            const payer = doc.utilities[u.id];
            return (
              <tr key={u.id}>
                <td>{u.label}</td>
                <td>{payer ? PAYER_LABEL[payer] : <Blank short />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    ),
  });

  sections.push({
    title: 'Pets',
    body: (
      <>
        {pets.length === 0 ? (
          <p>No pet may be kept at the premises without the Landlord’s written permission.</p>
        ) : (
          <>
            <p>
              The Tenant may keep {pets.length === 1 ? `this pet: ${bare(pets[0])}.` : 'these pets:'}
            </p>
            {pets.length > 1 && listOrLine(doc.pets)}
            <p>No other pet may be kept without the Landlord’s written permission.</p>
          </>
        )}
        <p>An assistance animal for a person with a disability is not a pet, and this section does not apply to one.</p>
      </>
    ),
  });

  if (doc.vehicles.trim()) {
    sections.push({
      title: 'Vehicles',
      body: (
        <>
          <p>
            The Tenant’s vehicles{lines(doc.vehicles).length === 1 ? `: ${bare(lines(doc.vehicles)[0])}.` : ':'}
          </p>
          {lines(doc.vehicles).length > 1 && listOrLine(doc.vehicles)}
        </>
      ),
    });
  }

  sections.push({
    title: 'Lead paint',
    body:
      doc.lead === 'before1978' ? (
        <p>
          The premises were built before 1978 and may contain lead paint. Before signing this lease the Tenant
          received the Massachusetts Tenant Lead Law Notification and Tenant Certification form, and a copy of
          any lead inspection report, letter of compliance or letter of interim control for the premises.
        </p>
      ) : doc.lead === 'after1978' ? (
        <p>The premises were built in 1978 or later.</p>
      ) : (
        <>
          <p>
            <span className="ls-choice">
              <span className="ls-box" />
              The premises were built in 1978 or later.
            </span>
            <span className="ls-choice">
              <span className="ls-box" />
              The premises were built before 1978 and may contain lead paint. Before signing this lease the
              Tenant received the Massachusetts Tenant Lead Law Notification and Tenant Certification form, and a
              copy of any lead inspection report, letter of compliance or letter of interim control for the
              premises.
            </span>
          </p>
        </>
      ),
  });

  for (const clause of doc.clauses) {
    if (!clause.title.trim() && !clause.body.trim()) continue;
    sections.push({
      title: clause.title.trim() || 'Additional term',
      body: lines(clause.body).map((para, i) => <p key={i}>{para}</p>),
    });
  }

  const signers = [
    { key: 'landlord', name: doc.landlord.name.trim(), role: 'Landlord' },
    ...(tenants.length > 0
      ? tenants.map((t) => ({ key: t.id, name: t.name.trim(), role: 'Tenant' }))
      : [{ key: 'tenant', name: '', role: 'Tenant' }]),
  ];

  return (
    <>
      <header className="ls-head">
        <div>
          <h1 className="ls-title">Residential Lease</h1>
          <p className="ls-address">{address || 'Massachusetts'}</p>
        </div>
        {agent.name.trim() && (
          <div className="ls-prepared">
            Prepared for the Landlord by
            <br />
            <strong>{agent.name.trim()}</strong>
            {agent.brokerage.trim() && <>, {agent.brokerage.trim()}</>}
            {(agent.phone.trim() || agent.email.trim()) && (
              <>
                <br />
                {[agent.phone.trim(), agent.email.trim()].filter(Boolean).join(' · ')}
              </>
            )}
          </div>
        )}
      </header>

      {sections.map((s, i) => (
        <Section key={i} n={i + 1} title={s.title}>
          {s.body}
        </Section>
      ))}

      <section className="ls-signatures">
        <p>Signed by the parties on the dates below. Each party receives a signed copy.</p>
        <div className="ls-sign-grid">
          {signers.map((s) => (
            <div key={s.key} className="ls-sign">
              <div className="ls-sign-row">
                <div className="ls-sign-line" />
                <div className="ls-sign-line" />
              </div>
              <div className="ls-sign-row">
                <div className="ls-sign-label">
                  <span className="ls-sign-role">{s.role}</span>
                  {s.name && <> · {s.name}</>}
                </div>
                <div className="ls-sign-label">
                  <span className="ls-sign-role">Date</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default LeaseDocument;
