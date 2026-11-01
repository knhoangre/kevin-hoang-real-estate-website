/**
 * The shape of a town guide, in either language.
 *
 * It was `Record<string, any>`, which meant nothing in the 2,500-line data
 * literal in NeighborhoodDetail was checked and neither was any of the rendering
 * that walks it — a misspelled key or a section missing its `title` would have
 * rendered blank rather than failing the build.
 */
export interface TownSection {
  type: 'intro' | 'section' | 'subsection' | 'cta';
  title?: string;
  text?: string;
  highlight?: string;
  note?: string;
  closing?: string;
  bullets?: string[];
  neighborhoods?: { name: string; description: string }[];
  reasons?: { icon: string; title: string; text: string }[];
}

export interface TownGuide {
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  content: TownSection[];
}

/**
 * The body of a town guide: the intro, the sections, the closing call.
 *
 * Moved out of NeighborhoodDetail so the English guides and the Chinese ones
 * (/zh/quyu/<slug>) are one layout with two sets of words.
 */
const TownGuideSections = ({ sections }: { sections: TownSection[] }) => (
  <>
    {sections.map((section, index) => {
      if (section.type === "intro") {
        return (
          <div key={index} className="mb-8 enter" style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}>
            <p className="text-gray-700 leading-relaxed mb-6 text-lg">
              {section.text}
            </p>
            {section.highlight && (
              <p className="text-xl font-semibold text-ink leading-relaxed">
                {section.highlight}
              </p>
            )}
          </div>
        );
      }

      if (section.type === "section") {
        return (
          <section key={index} className="mb-12 enter" style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}>
            <h2 className="text-3xl md:text-4xl font-bold text-ink mt-12 mb-6">
              {section.title}
            </h2>
            {section.text && (
              <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                {section.text}
              </p>
            )}
            {section.highlight && (
              <p className="text-lg font-semibold text-ink mb-4">
                {section.highlight}
              </p>
            )}
            {section.bullets && (
              <ul className="list-disc list-inside space-y-3 mb-6 text-gray-700 text-lg">
                {section.bullets.map((bullet: string, i: number) => (
                  <li key={i} className="leading-relaxed">{bullet}</li>
                ))}
              </ul>
            )}
            {section.note && (
              <p className="text-gray-600 italic leading-relaxed text-lg">
                {section.note}
              </p>
            )}
            {section.neighborhoods && (
              <div className="space-y-6 mt-6">
                {section.neighborhoods.map((n, i) => (
                  <div key={i} className="border-l-4 border-ink pl-6 py-2">
                    <h3 className="text-xl font-semibold text-ink mb-2">
                      {n.name}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {n.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {section.reasons && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {section.reasons.map((reason, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                  >
                    <div className="flex items-start">
                      <span className="text-3xl mr-4">{reason.icon}</span>
                      <div>
                        <h3 className="text-xl font-semibold text-ink mb-2">
                          {reason.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {reason.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      if (section.type === "subsection") {
        return (
          <div key={index} className="mb-8 enter" style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}>
            <h3 className="text-2xl font-semibold text-ink mt-8 mb-4">
              {section.title}
            </h3>
            {section.text && (
              <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                {section.text}
              </p>
            )}
            {section.bullets && (
              <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 text-lg ml-4">
                {section.bullets.map((bullet: string, i: number) => (
                  <li key={i} className="leading-relaxed">{bullet}</li>
                ))}
              </ul>
            )}
            {section.note && (
              <p className="text-gray-600 italic leading-relaxed text-lg">
                {section.note}
              </p>
            )}
          </div>
        );
      }

      if (section.type === "cta") {
        return (
          <div key={index} className="mt-16 pt-8 border-t border-gray-200 enter" style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}>
            <h2 className="text-3xl font-bold text-ink mb-6">
              {section.title}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6 text-lg">
              {section.text}
            </p>
            {section.highlight && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg mb-6">
                <p className="text-lg font-semibold text-ink leading-relaxed">
                  {section.highlight}
                </p>
              </div>
            )}
            {section.closing && (
              <p className="text-gray-700 leading-relaxed text-lg">
                {section.closing}
              </p>
            )}
          </div>
        );
      }

      return null;
    })}
  </>
);

export default TownGuideSections;
