import {
  layoutSheet,
  sheetHeadings,
  sheetWord,
  type Agent,
  type MarketingDoc,
  type SheetLayout,
  type SheetRow,
} from '@/lib/marketing';
import Pic from '../Pic';
import { brokerageOf, brokerages, step } from './parts';

/**
 * The three sheets — one design each for home expenses and home upgrades, which
 * are the same sheet with a different word in the title.
 *
 * A sheet is a header, a list and a footer on a portrait letter page. WHICH
 * COLUMNS THE LIST HAS, HOW LARGE IT IS SET AND WHERE IT BREAKS are decided by
 * layoutSheet() in marketing.ts, not here: a design only says what a row looks
 * like. A list too long for one page runs onto another with the header and
 * footer repeated, as Kevin's own twenty-six-line sheet does.
 */

type Design = (props: { doc: MarketingDoc }) => JSX.Element;

const title = (kind: MarketingDoc['kind']) => `Home ${sheetWord(kind)}`;

const whereOf = (doc: MarketingDoc) =>
  [doc.street.trim(), doc.cityLine.trim()].filter(Boolean).join(', ');

/** One page's worth of the list. The total and the small print go under the last page only. */
const Table = ({
  doc,
  layout,
  rows,
  last,
  tail,
}: {
  doc: MarketingDoc;
  layout: SheetLayout;
  rows: SheetRow[];
  last: boolean;
  /** Classic runs its rule a little past the last row. */
  tail?: boolean;
}) => {
  const heads = sheetHeadings(doc.kind);
  const { showDate, showValue, total } = layout;
  return (
    <>
      <div
        className={`tbl k-${doc.kind} ${showDate ? 'has-date' : ''} ${showValue ? 'has-value' : ''}`}
      >
        <div className="tr th">
          {showDate && <span className="td date">{heads.date}</span>}
          <span className="td label">{heads.label}</span>
          {showValue && <span className="td value">{heads.value}</span>}
        </div>
        {rows.map((row, i) => (
          <div key={i} className="tr">
            {showDate && <span className="td date num">{row.dateCell}</span>}
            <span className="td label">{row.label}</span>
            {showValue && <span className="td value num">{row.value}</span>}
          </div>
        ))}
        {last && total ? (
          <div className="tr total">
            {showDate && <span className="td date" />}
            <span className="td label">Total</span>
            <span className="td value num">{total}</span>
          </div>
        ) : (
          tail && (
            <div className="tr tail">
              {showDate && <span className="td date" />}
              <span className="td label" />
              {showValue && <span className="td value" />}
            </div>
          )
        )}
      </div>
      {last && doc.note.trim() && <p className="note">{doc.note}</p>}
    </>
  );
};

/** "REALTOR® | LPT REALTY" — the brokerage is on the sheet whether or not there is a logo. */
const titleLine = (agent: Agent, joiner: string) =>
  [agent.title.trim(), brokerageOf(agent)].filter(Boolean).join(joiner);

const contactLine = (agent: Agent, joiner: string) =>
  [agent.phone.trim(), agent.web.trim(), agent.email.trim()].filter(Boolean).join(joiner);

const SheetAgent = ({
  agent,
  index,
  logo,
  joiner,
}: {
  agent: Agent;
  index: number;
  logo: boolean;
  joiner: string;
}) => {
  const contact = contactLine(agent, joiner);
  return (
    <div className="agent">
      {agent.photo && <Pic slot={`agent${index}.photo`} className="agent-photo round" />}
      <div className="agent-text">
        <p className="agent-name">{agent.name}</p>
        <p className="agent-title">{titleLine(agent, joiner)}</p>
        {contact && <p className={`agent-contact num ${step(contact, 56, 999)}`}>{contact}</p>}
      </div>
      {logo && agent.logo && <Pic slot={`agent${index}.logo`} className="agent-logo" />}
    </div>
  );
};

const Footer = ({ doc, logo, joiner }: { doc: MarketingDoc; logo: boolean; joiner: string }) => (
  <div
    className={`ft ${doc.agents.length > 1 ? 'two' : ''} ${doc.agents[0]?.photo ? '' : 'no-photo'}`}
  >
    {doc.agents.map((agent, i) => (
      <SheetAgent key={i} agent={agent} index={i} logo={logo} joiner={joiner} />
    ))}
  </div>
);

/** Every page of a sheet: the same header and footer around each page of rows. */
const pagesOf = (
  doc: MarketingDoc,
  className: string,
  render: (table: JSX.Element) => JSX.Element
): JSX.Element => {
  const layout = layoutSheet(doc);
  return (
    <>
      {layout.pages.map((rows, i) => (
        <div key={i} className={`page sheet ${className} d-${layout.density}`}>
          {render(
            <Table
              doc={doc}
              layout={layout}
              rows={rows}
              last={i === layout.pages.length - 1}
              tail={className === 'sh-classic'}
            />
          )}
        </div>
      ))}
    </>
  );
};

/* ------------------------------------------------------------------ Classic */

export const ClassicSheet: Design = ({ doc }) => {
  const where = whereOf(doc);
  return pagesOf(doc, 'sh-classic', (table) => (
    <>
      <div className="hd">
        <Pic slot="header" />
        <div className="frost" />
        {where && <p className={`plate num ${step(where, 44, 54)}`}>{where}</p>}
        <h1 className="title">
          <b>Home</b>
          <i>{sheetWord(doc.kind)}</i>
        </h1>
      </div>
      <div className="body">{table}</div>
      <Footer doc={doc} logo joiner="  |  " />
    </>
  ));
};

/* --------------------------------------------------------------------- Noir */

export const NoirSheet: Design = ({ doc }) =>
  pagesOf(doc, 'sh-noir', (table) => (
    <>
      <div className="hd">
        <Pic slot="header" />
        <div className="shade" />
        <div className="words">
          <p className="eyebrow">
            <i />
            {title(doc.kind)}
          </p>
          <h1 className={`lnum ${step(doc.street, 26, 38)}`}>{doc.street}</h1>
          {doc.cityLine.trim() && <p className="num">{doc.cityLine}</p>}
        </div>
      </div>
      <div className="body">{table}</div>
      <Footer doc={doc} logo={false} joiner="  ·  " />
    </>
  ));

/* ------------------------------------------------------------------ Gallery */

export const GallerySheet: Design = ({ doc }) => {
  const where = whereOf(doc);
  return pagesOf(doc, 'sh-gallery', (table) => (
    <>
      <div className="hd">
        <div className="words">
          <p className="kicker">{brokerages(doc).join('  ·  ')}</p>
          <h1>{title(doc.kind).replace(/\b\w/g, (c) => c.toUpperCase())}</h1>
          {where && <p className="num">{where}</p>}
        </div>
        <Pic slot="header" />
      </div>
      <div className="body">{table}</div>
      <Footer doc={doc} logo joiner="  ·  " />
    </>
  ));
};
