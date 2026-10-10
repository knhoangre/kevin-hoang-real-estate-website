import { SITE } from '@/lib/siteConfig';
import type { Agent, MarketingDoc, Stat } from '@/lib/marketing';
import Pic from '../Pic';

/**
 * The pieces every design is built from.
 *
 * A design is a layout and a set of class names; what an agent's block
 * contains, what a brokerage is called and how a long value steps down are the
 * same everywhere, and are here so that they are.
 */

/**
 * The brokerage to print for an agent. NEVER EMPTY: 254 CMR 3.09 requires the
 * broker's name on all real estate advertising, and a booklet is advertising.
 * A blank field falls back to the site's own brokerage rather than to nothing.
 */
export const brokerageOf = (agent: Agent): string => agent.brokerage.trim() || SITE.brokerage;

/** Every brokerage on the document, once each, in order. */
export const brokerages = (doc: MarketingDoc): string[] => [
  ...new Set(doc.agents.map(brokerageOf)),
];

/** "Kevin Hoang & Maggie Li". Agents with no name typed yet are left out. */
export const agentNames = (doc: MarketingDoc): string =>
  doc.agents
    .map((a) => a.name.trim())
    .filter(Boolean)
    .join(' & ');

/**
 * A size step for text that was designed at one length and has been given
 * another: '' up to the first limit, then 's1', then 's2'. The stylesheet
 * decides what each step is. Longer text gets smaller rather than wrapping into
 * whatever is beside it.
 */
export const step = (value: string, first: number, second: number): '' | 's1' | 's2' =>
  value.length > second ? 's2' : value.length > first ? 's1' : '';

/** The same idea for a description: four sizes, by how much there is to fit. */
export const descStep = (value: string): '' | 't1' | 't2' | 't3' =>
  value.length > 1500 ? 't3' : value.length > 1150 ? 't2' : value.length > 820 ? 't1' : '';

/**
 * An agent, as the booklets draw one: headshot, then name, title and how to
 * reach them, then the brokerage — and its logo, on the designs that take one.
 * A line that was left blank is not drawn; there is no empty row for it.
 */
export const AgentCard = ({
  agent,
  index,
  logo,
}: {
  agent: Agent;
  index: number;
  logo: boolean;
}) => (
  <div className="agent">
    {agent.photo && <Pic slot={`agent${index}.photo`} className="agent-photo round" />}
    <div className="agent-text">
      <p className="agent-name">{agent.name}</p>
      {agent.title.trim() && <p className="agent-title">{agent.title}</p>}
      {agent.phone.trim() && <p className="agent-line num">{agent.phone}</p>}
      {agent.email.trim() && <p className="agent-line">{agent.email}</p>}
      {agent.web.trim() && <p className="agent-line">{agent.web}</p>}
      <p className="agent-brokerage">{brokerageOf(agent)}</p>
      {logo && agent.logo && <Pic slot={`agent${index}.logo`} className="agent-logo" />}
    </div>
  </div>
);

export const Agents = ({ doc, logo }: { doc: MarketingDoc; logo: boolean }) => (
  <div className={`agents ${doc.agents.length > 1 ? 'two' : ''}`}>
    {doc.agents.map((agent, i) => (
      <AgentCard key={i} agent={agent} index={i} logo={logo} />
    ))}
  </div>
);

/** A labelled figure. The value steps down when it is longer than a number. */
export const StatCell = ({
  stat,
  limits = [9, 13],
  labelLimits = [12, 16],
}: {
  stat: Stat;
  limits?: [number, number];
  /** Narrow cells step their labels down sooner: "BATHROOMS" is wider than "BEDS". */
  labelLimits?: [number, number];
}) => (
  <div className="stat">
    <p className={`stat-label ${step(stat.label, labelLimits[0], labelLimits[1])}`}>
      <span>{stat.label}</span>
    </p>
    <p className={`stat-value num ${step(stat.value, limits[0], limits[1])}`}>{stat.value}</p>
  </div>
);

/** The price as a stat, where a design draws it like one. Nothing when there is none. */
export const priceStat = (doc: MarketingDoc): Stat[] =>
  doc.price.trim() ? [{ label: 'Price', value: doc.price.trim() }] : [];
