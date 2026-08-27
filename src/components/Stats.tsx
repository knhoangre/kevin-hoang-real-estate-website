import { Star, BadgeCheck, CalendarDays, Handshake, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SITE } from "@/lib/siteConfig";

/**
 * The credibility row.
 *
 * Every figure here is checkable, and each tile links to the thing that proves
 * it. That is the whole design constraint, and it replaced four numbers that
 * could not be sourced at all: "100% personalized service", "14 DAYS average
 * time on market", "99.9% client satisfaction" and "5+ YEARS market
 * experience". The first was a slogan wearing a number's clothes; the middle
 * two had no measurement behind them; the last was true but unlinked.
 *
 * A claim a visitor can verify in one click converts better than a bigger one
 * they have to take on faith — and unverifiable statistics are exactly what
 * Google's guidance on trust signals warns against.
 *
 * If any of these stop being true, change them here. Do not add a tile whose
 * number you cannot point at a source for.
 */

/** Google Business Profile rating. Confirmed against the profile 2026-08-26. */
const GOOGLE_RATING = "5.0";
const GOOGLE_REVIEW_COUNT = 22;

/**
 * Massachusetts salesperson licence issued 2021; broker licence obtained 2026.
 * A broker licence requires years of practice as a salesperson plus further
 * education and a separate exam, so it is a genuine differentiator — most
 * practising agents hold a salesperson licence. Both are public record at
 * elicensing.mass.gov.
 */
const LICENSED_SINCE = 2021;

/**
 * Total closed transactions since 2021 — sales AND rentals.
 *
 * Set this to the real count and the tile appears; leave it at 0 and the
 * "licensed since" tile shows instead. Same discipline as SITE.geo: a figure
 * ships only once it is real.
 *
 * The label says "clients served", not "homes sold" or "homes closed", and the
 * sub-label names both transaction types. That wording is load-bearing: in
 * this industry "sold" and "closed" mean sale transactions, so folding lease
 * placements into either one is the kind of technically-arguable phrasing the
 * FTC's endorsement guidance treats as deceptive. Counting them is fine.
 * Mislabelling them is not.
 */
const CLIENTS_SERVED = 0;

const Stats = () => {
  const { t } = useTranslation();

  const tiles = [
    {
      icon: Star,
      value: `${GOOGLE_RATING} ★`,
      label: t("stats.rating"),
      note: `${GOOGLE_REVIEW_COUNT} ${t("stats.rating_note")}`,
      href: SITE.sameAs[0],
      external: true,
    },
    {
      icon: BadgeCheck,
      value: "Broker",
      label: t("stats.credential"),
      note: t("stats.credential_note"),
    },
    CLIENTS_SERVED > 0
      ? {
          icon: Handshake,
          value: `${CLIENTS_SERVED}`,
          label: t("stats.clients"),
          note: t("stats.clients_note"),
        }
      : {
          icon: CalendarDays,
          value: String(LICENSED_SINCE),
          label: t("stats.licensed_since"),
          note: t("stats.licensed_note"),
        },
    {
      icon: MapPin,
      value: String(SITE.areaServed.length),
      label: t("stats.towns"),
      note: t("stats.towns_note"),
      href: "/neighborhoods",
    },
  ];

  // #1a1a1a is the footer's background. This used to be bg-realDark
  // (#1A1F2C), a blue-tinted near-black, which read as a mismatched shade
  // sitting a few hundred pixels above the footer on the same page.
  return (
    <section className="py-24 bg-[#1a1a1a] text-white">
      <div className="container px-4">
        <h2 className="text-4xl font-bold text-center mb-16">{t("stats.title")}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {tiles.map((tile, index) => {
            const Icon = tile.icon;
            const body = (
              <>
                <div className="flex justify-center mb-4">
                  <Icon className="h-8 w-8 text-realPurple" aria-hidden />
                </div>
                <div className="text-3xl font-bold mb-2">{tile.value}</div>
                <div className="text-gray-400 uppercase text-sm tracking-wide">{tile.label}</div>
                <div className="text-gray-500 text-xs mt-1">{tile.note}</div>
              </>
            );

            const className =
              "text-center enter block rounded-lg p-4 transition-colors hover:bg-white/5";
            const style = { "--enter-delay": `${index * 0.08}s` } as React.CSSProperties;

            if (tile.href && tile.external) {
              return (
                <a
                  key={tile.label}
                  href={tile.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                  style={style}
                >
                  {body}
                </a>
              );
            }
            if (tile.href) {
              return (
                <Link key={tile.label} to={tile.href} className={className} style={style}>
                  {body}
                </Link>
              );
            }
            return (
              <div key={tile.label} className={`${className} hover:bg-transparent`} style={style}>
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
