/**
 * Fetching the evidence behind a comparable-sales estimate.
 *
 * The split with valuation.ts is deliberate and worth keeping: that module is
 * pure arithmetic with no network, so it can be run against a synthetic market
 * whose true answer is known (scripts/valuation-check.ts). This one is the part
 * that talks to Supabase, and it holds no judgement at all.
 *
 * Everything here follows the rule the other supporting queries on
 * /search/<mls> follow — `priceHistory`, `officeName`, `similarListings`: it
 * returns an empty result rather than throwing, and it must never be able to
 * take the listing page down with it. An estimate is context. The listing is
 * the subject.
 */
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE } from '@/lib/siteConfig';
import { withRetry } from '@/lib/idxSearch';
import { soldComps, soldOnCockroach } from '@/lib/soldApi';
import {
  addressKey,
  TIERS,
  type Comp,
  type ValuationSubject,
} from '@/lib/valuation';

/* -------------------------------------------------------------------------- */
/* Typing the tables types.ts does not know yet                                */
/* -------------------------------------------------------------------------- */

/**
 * TEMPORARY, AND DELETE IT THE MOMENT THE TYPES ARE REGENERATED.
 *
 * `src/integrations/supabase/types.ts` is generated from the live project and
 * cannot be hand-edited, so it will not describe `idx_geocodes` or the
 * `idx_comparable_sales` function until the migrations are pushed and it is
 * regenerated:
 *
 *   npx supabase db push
 *   npx supabase gen types typescript --project-id zvipgykolpoxukyjgffx \
 *     > src/integrations/supabase/types.ts
 *
 * …after which this whole block goes and the calls below use `supabase`
 * directly.
 *
 * WHY THIS IS NOT THE `db` ESCAPE HATCH THAT WAS DELETED. That one was a cast
 * to a loosely-typed client, and the related `as any` on the mock client
 * collapsed the exported union to `any` — which switched off type checking for
 * every Supabase call in the app and is how the CRM CSV shipped a blank
 * "Sources" column. This asserts a PRECISE schema, declared immediately below
 * and checked by the compiler on every call site: a misspelled column or a
 * wrong argument type is still an error. The reach is one module and two names.
 * It is a stopgap with a stated end, not an opt-out.
 */
interface CompsSchema {
  public: {
    Tables: {
      idx_geocodes: {
        Row: {
          address_key: string;
          lat: number | null;
          lon: number | null;
          precision: string;
          geocoded_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      idx_comparable_sales: {
        Args: {
          p_prop_type: string;
          p_town: string | null;
          p_state?: string;
          p_lat?: number | null;
          p_lon?: number | null;
          p_radius_km?: number | null;
          p_months?: number;
          p_min_sqft?: number | null;
          p_max_sqft?: number | null;
          p_exclude_mls?: string | null;
          p_limit?: number;
        };
        Returns: Comp[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const compsDb = supabase as unknown as SupabaseClient<CompsSchema>;

/* -------------------------------------------------------------------------- */
/* Suppression                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Whether an estimate may be shown for this listing at all.
 *
 * NAR's IDX policy authorises automated valuations on an IDX display, and
 * separately permits MLS content to be used for "supporting appraisals and
 * evaluations, or developing market statistics". But a display showing an
 * automated value estimate IN IMMEDIATE CONJUNCTION WITH A LISTING has to be
 * switched off for that listing at the seller's request, and MLS PIN's feed
 * carries no field saying which sellers have asked. So the mechanism has to
 * exist on our side before the request arrives, not after: a policy you can
 * only comply with by shipping code is one you are out of compliance with for
 * however long the deploy takes.
 *
 * Two levels, both in siteConfig beside the other dated assumptions, and both
 * committed rather than in a table — this has to keep working on the day the
 * database does not, and it has to be reviewable in a diff.
 *
 * Suppression removes the ESTIMATE. The comps, the chart and the range stay,
 * because those are the market-statistics use the policy names separately and
 * they are what the reader actually learns from.
 */
export const estimateSuppressed = (mls: string): boolean =>
  !SITE.valuation.enabled || SITE.valuation.suppressedMls.includes(mls);

/* -------------------------------------------------------------------------- */
/* Geocoding the subject                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The subject's coordinate, or null.
 *
 * Read-only: nothing here geocodes on demand. The browser cannot write to
 * `idx_geocodes` (no grant, by design) and a per-pageview call out to a federal
 * geocoder would be both slow and rude. Coordinates arrive from
 * scripts/geocode-listings.mjs, and until they do this returns null and the
 * comp ladder runs without distance — which it is built to do.
 */
export const subjectCoordinate = async (
  subject: ValuationSubject
): Promise<{ lat: number; lon: number } | null> => {
  const key = addressKey(subject.address, subject.town, subject.state, subject.zip);
  try {
    const { data, error } = await compsDb
      .from('idx_geocodes')
      .select('lat, lon')
      .eq('address_key', key)
      .maybeSingle();
    if (error || !data || data.lat === null || data.lon === null) return null;
    return { lat: data.lat, lon: data.lon };
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/* Candidates                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Every sale that could possibly be a comp for this subject.
 *
 * ONE QUERY AT THE WIDEST BOUNDS, not one per tier. The tiers are then applied
 * in the browser by `valuate()`, which is what lets the ladder walk five rungs
 * without five round trips — and, more importantly, lets the market trend be
 * fitted across the WHOLE candidate set rather than across the handful of sales
 * that survived the tightest rung. A trend estimated from six comps is noise;
 * one estimated from two hundred sales in the same town is a measurement.
 *
 * The widest bounds come from the last tier rather than being written out again
 * here, so adding or loosening a rung cannot leave the query unable to feed it.
 * That has an obvious failure mode if a future tier is wider than the query, so
 * the months and the size band are both derived from TIERS directly.
 *
 * No radius is passed. Distance filtering happens per tier in the browser, on
 * the `distance_km` the query returns — and asking for a radius here would
 * exclude every ungeocoded row from the wide rungs, which are precisely the
 * rungs that exist to catch them.
 */
export const comparableCandidates = async (
  subject: ValuationSubject,
  coordinate: { lat: number; lon: number } | null
): Promise<Comp[]> => {
  if (!subject.prop_type || !subject.town) return [];
  const area = subject.living_area ?? 0;
  if (area <= 0) return [];

  const widest = TIERS.reduce(
    (acc, t) => ({
      months: Math.max(acc.months, t.months),
      sqftTolerance: Math.max(acc.sqftTolerance, t.sqftTolerance),
    }),
    { months: 0, sqftTolerance: 0 }
  );

  try {
    const bounds = {
      p_prop_type: subject.prop_type,
      p_town: subject.town,
      // Not optional. Town names are not unique across MLS PIN's coverage —
      // "Dover" is 127 Massachusetts rows and 19 New Hampshire ones on the live
      // feed — so a comp set banded on town alone silently spans two markets.
      p_state: subject.state ?? 'MA',
      p_lat: coordinate?.lat ?? null,
      p_lon: coordinate?.lon ?? null,
      p_radius_km: null,
      p_months: widest.months,
      p_min_sqft: Math.round(area * (1 - widest.sqftTolerance)),
      p_max_sqft: Math.round(area * (1 + widest.sqftTolerance)),
      p_exclude_mls: subject.mls_number,
      p_limit: 250,
    };

    /*
     * RETRIED, like every /search read. The first call after a quiet spell — or
     * right after a sync rewrote the pages — reads the index off disk and can
     * exceed the anon role's 8s timeout; measured 2026-09-26, a cold call timed
     * out and the next answered in 0.2s. Without the retry the estimate simply
     * failed to appear for whichever visitor happened to be first, and since
     * this fetch swallows its errors, nobody would ever have known why.
     */
    // The same question, of the database that keeps every sale, once
    // SITE.soldData says the reads have moved. One `bounds` object feeds both
    // paths, so they cannot drift on what a bound means.
    if (soldOnCockroach()) {
      return await withRetry(() => soldComps<Comp>(bounds), 'Comparable sales');
    }

    const { data, error } = await withRetry(async () => {
      const res = await compsDb.rpc('idx_comparable_sales', bounds);
      // withRetry retries on a THROW, and a PostgREST error arrives as a value,
      // so it is rethrown here — otherwise a timeout would never be retried.
      if (res.error) throw res.error;
      return res;
    }, 'Comparable sales');
    if (error) throw error;
    return (data ?? []) as Comp[];
  } catch (err) {
    // Swallowed on purpose, and logged rather than surfaced. This is the same
    // contract priceHistory() keeps: supporting context that fails must leave
    // the listing standing.
    console.warn(
      'Comparable sales lookup failed:',
      err instanceof Error ? err.message : err
    );
    return [];
  }
};
