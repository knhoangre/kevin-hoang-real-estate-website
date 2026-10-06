/**
 * Saved homes and viewing history — the reading and writing.
 *
 * Everything that touches `listing_favorites` and `listing_views` goes through
 * here. The judgement about what to recommend is in recommendations.ts, which is
 * pure; this file fetches and holds none.
 *
 * WHAT THE DATABASE DOES, so that this file does not have to be trusted:
 *   - a saved home's snapshot is copied from idx_listings by a trigger, whatever
 *     is sent — so `saveListing` sends only the MLS number;
 *   - a view is written only by `record_listing_view()`, which has no direct
 *     table equivalent;
 *   - RLS returns the caller's own rows, and every row to the admin.
 * See 20261006120000_listing_favorites_and_views.sql and its tests.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { AVAILABLE_STATUSES, type IdxListing } from '@/lib/idxSearch';
import { soldByMls, soldOnCockroach } from '@/lib/soldApi';
import {
  FAVORITE_WEIGHT,
  rankCandidates,
  tasteProfile,
  viewWeight,
  type TasteProfile,
  type TasteSignal,
} from '@/lib/recommendations';

export type FavoriteRow = Database['public']['Tables']['listing_favorites']['Row'];
export type ViewRow = Database['public']['Tables']['listing_views']['Row'];

/* -------------------------------------------------------------------------- */
/* The signed-in visitor's own                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The caller's saved homes, newest first.
 *
 * FILTERED BY USER ON PURPOSE, even though RLS scopes a visitor to their own
 * rows. The admin's policy is every row, so without the filter Kevin's own
 * "Saved homes" page would list what every client had saved — the same mistake
 * /rentals made with applications. RLS is a ceiling on what a query MAY read,
 * not a statement of what it MEANS.
 */
export const listFavorites = async (userId: string): Promise<FavoriteRow[]> => {
  const { data, error } = await supabase
    .from('listing_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

/**
 * Saves a home. Only the MLS number is sent; the row's owner and its snapshot
 * are set by the database.
 *
 * `ignoreDuplicates` because a double tap, or two tabs, is not an error worth
 * showing anyone — the home is saved either way.
 */
export const saveListing = async (mls: string): Promise<void> => {
  const { error } = await supabase
    .from('listing_favorites')
    .upsert({ mls_number: mls }, { onConflict: 'user_id,mls_number', ignoreDuplicates: true });
  if (error) throw error;
};

export const unsaveListing = async (userId: string, mls: string): Promise<void> => {
  const { error } = await supabase
    .from('listing_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('mls_number', mls);
  if (error) throw error;
};

/** The caller's recently viewed homes, most recent first. Same user filter, same reason. */
export const listViews = async (userId: string, limit = 60): Promise<ViewRow[]> => {
  const { data, error } = await supabase
    .from('listing_views')
    .select('*')
    .eq('user_id', userId)
    .order('last_viewed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
};

/**
 * Notes that the signed-in visitor opened a listing.
 *
 * NEVER THROWS and is never awaited by the page. It is bookkeeping behind
 * somebody reading about a house; a failure here must not become an error on
 * the one page whose job is to show them that house.
 */
export const recordView = (mls: string): void => {
  void supabase
    .rpc('record_listing_view', { p_mls: mls })
    .then(({ error }) => {
      if (error) console.warn('Could not record the view:', error.message);
    });
};

/**
 * Live rows for a set of MLS numbers, keyed by number.
 *
 * A saved or viewed home that is missing from the result has left the feed —
 * sold, withdrawn, expired — and the caller falls back to the snapshot on its
 * own row. Returns an empty map rather than throwing: the snapshot is always
 * enough to render something true.
 */
export const listingsByMls = async (mls: string[]): Promise<Map<string, IdxListing>> => {
  const out = new Map<string, IdxListing>();
  const unique = [...new Set(mls)];
  if (unique.length === 0) return out;
  try {
    const { data, error } = await supabase
      .from('idx_listings')
      .select('*')
      .in('mls_number', unique);
    if (error) throw error;
    for (const row of (data ?? []) as IdxListing[]) out.set(row.mls_number, row);
  } catch (err) {
    console.warn('Could not refresh saved listings:', err);
  }

  // Whatever is not on the market may have SOLD, and sold listings live in a
  // second database once the reads have moved. Asked only about the misses.
  if (soldOnCockroach()) {
    const missing = unique.filter((m) => !out.has(m));
    if (missing.length > 0) {
      try {
        for (const row of await soldByMls(missing)) out.set(row.mls_number, row);
      } catch (err) {
        console.warn('Could not look up sold listings:', err);
      }
    }
  }
  return out;
};

/* -------------------------------------------------------------------------- */
/* Recommendations                                                             */
/* -------------------------------------------------------------------------- */

/** A history as signals: a saved home is a decision, a view is a glance. */
export const signalsFrom = (favorites: FavoriteRow[], views: ViewRow[]): TasteSignal[] => [
  ...favorites.map((f) => ({
    town: f.town,
    state: f.state,
    propType: f.prop_type,
    price: f.list_price,
    bedrooms: f.bedrooms,
    weight: FAVORITE_WEIGHT,
  })),
  ...views.map((v) => ({
    town: v.town,
    state: v.state,
    propType: v.prop_type,
    price: v.list_price,
    bedrooms: v.bedrooms,
    weight: viewWeight(v.view_count),
  })),
];

export interface Recommendations {
  /** Null when the history holds nothing to build one from. */
  profile: TasteProfile | null;
  listings: IdxListing[];
}

/**
 * Homes on the market that fit what somebody has been looking at, excluding
 * everything they have already saved or opened.
 *
 * ONE QUERY PER TOWN, each an equality on town + state + type with a price
 * range and an ORDER BY list_price — the shape the per-town partial indexes
 * were built for (see 20260927100000_idx_search_speed). One query with
 * `town IN (…)` could not use them and would sort every match.
 *
 * `state` is filtered because town names are not unique in the feed, and
 * `nullsFirst: false` is load-bearing on those indexes — see CLAUDE.md.
 *
 * Never throws: a failed town is a town left out, and a profile with no results
 * is an honest empty list.
 */
export const recommendFor = async (
  favorites: FavoriteRow[],
  views: ViewRow[]
): Promise<Recommendations> => {
  const profile = tasteProfile(signalsFrom(favorites, views));
  if (!profile) return { profile: null, listings: [] };

  const seen = new Set([
    ...favorites.map((f) => f.mls_number),
    ...views.map((v) => v.mls_number),
  ]);

  const perTown = await Promise.all(
    profile.towns.map(async ({ town, state }) => {
      try {
        let query = supabase
          .from('idx_listings')
          .select('*')
          .eq('feed', 'active')
          .in('status', AVAILABLE_STATUSES)
          .eq('town', town)
          .gte('list_price', profile.minPrice)
          .lte('list_price', profile.maxPrice);

        if (state) query = query.eq('state', state);
        // In the sale market with no dominant type, rentals still must not leak in.
        query = profile.propType
          ? query.eq('prop_type', profile.propType)
          : query.neq('prop_type', 'RN');
        if (profile.bedrooms !== null) {
          query = query.gte('bedrooms', profile.bedrooms - 1).lte('bedrooms', profile.bedrooms + 1);
        }

        const { data, error } = await query
          .order('list_price', { ascending: false, nullsFirst: false })
          // More than will be shown: the already-seen ones come out of this.
          .limit(40);
        if (error) throw error;
        return (data ?? []) as IdxListing[];
      } catch (err) {
        console.warn(`Could not load recommendations for ${town}:`, err);
        return [];
      }
    })
  );

  const pool = perTown.flat();
  const ranked = rankCandidates(
    pool.map((l) => ({ mls: l.mls_number, town: l.town, price: l.list_price, listing: l })),
    profile,
    seen
  );
  return { profile, listings: ranked.map((r) => r.listing) };
};

/* -------------------------------------------------------------------------- */
/* The admin's view                                                            */
/* -------------------------------------------------------------------------- */

export interface ClientActivity {
  userId: string;
  email: string | null;
  name: string | null;
  savedCount: number;
  viewedCount: number;
  lastActive: string | null;
}

/** One row per person who has saved or viewed anything. Admin only; the function refuses others. */
export const clientActivity = async (): Promise<ClientActivity[]> => {
  const { data, error } = await supabase.rpc('admin_client_activity');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    userId: row.user_id,
    email: row.email,
    name: row.full_name,
    savedCount: Number(row.saved_count),
    viewedCount: Number(row.viewed_count),
    lastActive: row.last_active,
  }));
};

/** What one client saved and what they looked at, for the admin. RLS lets only the admin read another's. */
export const clientDetail = async (
  userId: string
): Promise<{ favorites: FavoriteRow[]; views: ViewRow[] }> => {
  const [favorites, views] = await Promise.all([listFavorites(userId), listViews(userId, 100)]);
  return { favorites, views };
};
