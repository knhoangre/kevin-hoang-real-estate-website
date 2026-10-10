import { getPhoto, type MarketingDoc } from '@/lib/marketing';
import Pic from '../Pic';
import {
  Agents,
  StatCell,
  agentNames,
  brokerages,
  descStep,
  priceStat,
  step,
} from './parts';

/**
 * The four booklets.
 *
 * Each is TWO PAGES of a landscape letter sheet, printed on both sides and
 * folded in half. Page one is the OUTSIDE: its left half is the back of the
 * booklet and its right half the front cover. Page two is the inside spread.
 * So `panel left` on page one is the last thing a reader sees and `panel
 * right` the first.
 *
 * Classic and Welcome Home are Kevin's own — rebuilt from the files in pdf/
 * with his name and brokerage where the originals carried another agent's.
 * Noir and Gallery are new, in the site's own ink, champagne and two faces.
 *
 * The geometry is in print.css. What is here is which words and which frames
 * go where, and the rule every one of them follows: WHAT IS EMPTY IS NOT DRAWN.
 * No price, no price block; three facts, three cells.
 */

type Design = (props: { doc: MarketingDoc }) => JSX.Element;

/* ------------------------------------------------------------------ Classic */

export const ClassicBooklet: Design = ({ doc }) => {
  // A floor plan that has no picture is not a frame on the page — except the
  // first, so there is somewhere to click to add one.
  const plans = [1, 2, 3].filter((n) => n === 1 || getPhoto(doc, `plan${n}`));
  const [beside, ...four] = doc.stats;

  return (
    <>
      <div className="page booklet bk-classic">
        <div className="panel left">
          <i className="rule top" />
          <i className="rule bottom" />
          {doc.back === 'plan' ? (
            <>
              <h2 className="plan-title">Floor plan</h2>
              <div className={`plans n${plans.length}`}>
                {plans.map((n) => (
                  <figure key={n}>
                    <Pic slot={`plan${n}`} />
                    {doc.planCaptions[n - 1]?.trim() && (
                      <figcaption>{doc.planCaptions[n - 1]}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <>
              <Pic slot="back1" className="back-photo one" />
              <Pic slot="back2" className="back-photo two" />
            </>
          )}
        </div>
        <div className="panel right">
          <i className="rule top" />
          <i className="rule bottom" />
          <Pic slot="cover" className="cover-photo" />
          {(doc.street.trim() || doc.cityLine.trim()) && (
            <div className={`plate ${step(doc.street, 22, 28)}`}>
              <span>{doc.street}</span>
              <span className="num">{doc.cityLine}</span>
            </div>
          )}
          <Agents doc={doc} logo />
        </div>
      </div>

      <div className="page booklet bk-classic">
        <div className="panel left">
          <Pic slot="in1" className="lead" />
          <p className={`desc ${descStep(doc.description)}`}>{doc.description}</p>
          <div className="stats pair">
            {[...priceStat(doc), ...(beside ? [beside] : [])].map((stat) => (
              <StatCell key={stat.label} stat={stat} limits={[11, 15]} />
            ))}
          </div>
        </div>
        <div className="panel right">
          <div className="six">
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <Pic key={n} slot={`in${n}`} />
            ))}
          </div>
          <div className="stats four">
            {four.slice(0, 4).map((stat) => (
              <StatCell key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------- Welcome Home */

export const WelcomeBooklet: Design = ({ doc }) => {
  const where = [doc.street.trim(), doc.cityLine.trim()].filter(Boolean).join(' | ');
  const presents = `${brokerages(doc).join(' & ')} presents`;
  const [second, ...cross] = doc.stats;
  const features = doc.features.map((f) => f.trim()).filter(Boolean);

  return (
    <>
      <div className="page booklet bk-welcome">
        <div className="panel left">
          <h2 className={`presents ${step(presents, 26, 34)}`}>{presents}</h2>
          <p className={`where num ${step(where, 34, 44)}`}>{where}</p>
          <Pic slot="back1" className="band-photo" />
          <Agents doc={doc} logo />
        </div>
        <div className="panel right">
          <Pic slot="cover" className="band-photo" />
          {/* Drawn over the photograph, which runs under it to the paper's edge. */}
          <div className="frame" />
          {doc.headline.trim() && (
            <h1 className={`headline ${step(doc.headline, 14, 22)}`}>
              <span>{doc.headline}</span>
            </h1>
          )}
          <p className={`where num ${step(where, 30, 40)}`}>{where}</p>
          <p className="byline">
            <b>{agentNames(doc)}</b>
            <span>- {brokerages(doc).join(' & ')} -</span>
          </p>
        </div>
      </div>

      <div className="page booklet bk-welcome">
        <div className="grey" />
        <Pic slot="in2" className="w w-a" />
        <Pic slot="in3" className="w w-b" />
        <Pic slot="in4" className="w w-c" />
        <Pic slot="in5" className="w w-d" />
        <Pic slot="in6" className="w w-e" />
        <Pic slot="in1" className="w w-f" />
        <Pic slot="in7" className="w w-g" />
        <Pic slot="in8" className="w w-h" />

        {[...priceStat(doc), ...(second ? [second] : [])].slice(0, 2).map((stat, i) => (
          <div key={stat.label} className={`headfact ${i === 0 ? 'one' : 'two'}`}>
            <StatCell stat={stat} limits={[10, 14]} />
          </div>
        ))}

        {cross.length > 0 && (
          <div className="cross">
            {cross.slice(0, 4).map((stat) => (
              <StatCell key={stat.label} stat={stat} limits={[4, 8]} labelLimits={[7, 10]} />
            ))}
          </div>
        )}

        {features.length > 0 && (
          <div className={`features ${features.length > 5 ? 's1' : ''}`}>
            <h3>Key features:</h3>
            <ul>
              {features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

/* --------------------------------------------------------------------- Noir */

const Facts = ({ doc, count }: { doc: MarketingDoc; count: number }) =>
  doc.stats.length === 0 ? null : (
    <div className="facts">
      {doc.stats.slice(0, count).map((stat) => (
        <div key={stat.label} className="fact">
          <b className={`num ${step(stat.value, 7, 11)}`}>{stat.value}</b>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );

export const NoirBooklet: Design = ({ doc }) => {
  const lead = doc.agents[0];
  return (
    <>
      <div className="page booklet bk-noir">
        <div className="field" />
        <div className="panel left">
          <Pic slot="back1" className="back-photo" />
          <Agents doc={doc} logo={false} />
          {doc.cityLine.trim() && <p className="back-foot num">{doc.cityLine}</p>}
        </div>
        <div className="panel right">
          <Pic slot="cover" className="cover-photo" />
          <div className="fade" />
          <div className="cover-words">
            <p className="eyebrow">
              <i />
              {brokerages(doc).join(' & ')} presents
            </p>
            <h1 className={`street lnum ${step(doc.street, 20, 30)}`}>{doc.street}</h1>
            {doc.cityLine.trim() && <p className="city num">{doc.cityLine}</p>}
          </div>
          <p className="cover-foot">
            <span>{agentNames(doc)}</span>
            {lead?.phone.trim() && <span className="num">{lead.phone}</span>}
          </p>
        </div>
      </div>

      <div className="page booklet bk-noir">
        <div className="field" />
        <Pic slot="in1" className="full" />
        <div className="panel right">
          <div className="story">
            {doc.cityLine.trim() && (
              <p className="eyebrow num">
                <i />
                {doc.cityLine}
              </p>
            )}
            <h2 className={`lnum ${step(doc.street, 24, 24)}`}>{doc.street}</h2>
            <i className="hair" />
            <p className={`desc ${descStep(doc.description)}`}>{doc.description}</p>
            {doc.price.trim() && (
              <p className="offered">
                <span>Offered at</span>
                <b className="num">{doc.price}</b>
              </p>
            )}
            <Facts doc={doc} count={4} />
            <div className="trio">
              <Pic slot="in2" />
              <Pic slot="in3" />
              <Pic slot="in4" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ Gallery */

export const GalleryBooklet: Design = ({ doc }) => {
  const lead = doc.agents[0];
  const reach = [agentNames(doc), lead?.phone.trim(), lead?.web.trim()].filter(Boolean).join('  ·  ');
  return (
    <>
      <div className="page booklet bk-gallery">
        <div className="panel left">
          <Pic slot="back1" className="back-photo" />
          <Agents doc={doc} logo />
          {doc.cityLine.trim() && <p className="foot num">{doc.cityLine}</p>}
        </div>
        <div className="panel right">
          <p className="kicker cover-kicker">{brokerages(doc).join('  ·  ')}</p>
          <Pic slot="cover" className="cover-photo" />
          <div className="title">
            <h1 className={`lnum ${step(doc.street, 20, 28)}`}>{doc.street}</h1>
            <i />
            {doc.cityLine.trim() && <p className="num">{doc.cityLine}</p>}
          </div>
          {agentNames(doc) && <p className="foot">Presented by {agentNames(doc)}</p>}
        </div>
      </div>

      <div className="page booklet bk-gallery">
        <div className="panel left">
          <Pic slot="in1" className="lead" />
          <div className="copy">
            {doc.cityLine.trim() && <p className="kicker num">{doc.cityLine}</p>}
            <h2 className={`lnum ${step(doc.street, 28, 28)}`}>{doc.street}</h2>
            <i className="hair" />
            <p className={`desc ${descStep(doc.description)}`}>{doc.description}</p>
          </div>
        </div>
        <div className="panel right">
          <div className="four">
            <Pic slot="in2" />
            <Pic slot="in3" />
            <Pic slot="in4" />
            <Pic slot="in5" />
          </div>
          {doc.price.trim() && (
            <p className="offered">
              <span className="kicker">Offered at</span>
              <b className="num">{doc.price}</b>
            </p>
          )}
          <Facts doc={doc} count={4} />
          {reach && <p className="foot num">{reach}</p>}
        </div>
      </div>
    </>
  );
};
