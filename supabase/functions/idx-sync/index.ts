/**
 * Ingests the MLS PIN IDX active feeds into idx_listings.
 *
 * Invoke with a service-role key. Body (all optional):
 *   { "propTypes": ["SF"], "offices": true }
 *
 * Defaults to every configured property type. In practice the schedule calls it
 * ONE property type at a time — see the note on wall-clock time below.
 *
 * WHAT MAKES THIS CORRECT RATHER THAN JUST WORKING:
 *
 * 1. Deletion is a compliance requirement, not housekeeping. A listing pulled
 *    from the feed must stop being displayed, so every run stamps `synced_at`
 *    on what it touched and then deletes anything older WITHIN THE PROPERTY
 *    TYPES IT ACTUALLY FETCHED. Scoping matters: a run that syncs only SF must
 *    not delete every condo because it did not see one.
 *
 * 2. An empty parse never deletes. mlspin-auth throws if the response is not a
 *    feed, but if a genuinely empty file ever arrived, deleting the whole table
 *    on the strength of it would be the same mistake sync-listings.mjs refuses
 *    to make with the sold snapshot. Zero rows aborts that type.
 *
 * 3. Every run is recorded in idx_sync_runs, success or failure. MLS PIN
 *    requires a visible "data last updated" time on an IDX display, and a failed
 *    run has to be distinguishable from a quiet one — otherwise the page keeps
 *    claiming freshness it does not have.
 *
 * WALL-CLOCK TIME. The four active feeds are ~28 MB of text and 23,400 rows
 * together. One property type per invocation keeps each run well inside the
 * Edge Function limit, and a failure then costs one type rather than all four.
 *
 * THE SOLD FEED IS ALSO KEPT, IN A SECOND DATABASE. When SOLD_DB_URL_RW is set,
 * every sold batch is offered to CockroachDB as well (see _shared/soldDb.ts and
 * cockroach/schema). Supabase deletes a sale when it ages out of MLS PIN's
 * twelve-month window, because 500 MB will not hold more; that table never
 * deletes and holds every town and every column. Without the secret none of
 * that code runs and this function behaves exactly as it did before.
 *
 * Two extra bodies exist for it, both SERVICE ROLE ONLY and both leaving
 * idx_sync_runs alone — they are not feed syncs, and a row marked ok there is
 * what the site reads as "listing data last updated":
 *
 *   { "importArchive": true, "offset": 0, "limit": 1000 }
 *       One-time copy of Supabase's idx_sold_archive into the new table. Adds
 *       only what is missing; never replaces a full feed row with a thin one.
 *
 *   { "soldGeocodes": true }
 *       Pushes coordinates found since the last push onto sales that were
 *       ingested before their address had been geocoded.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { rowParser, type IdxListing } from '../_shared/idx.ts';
import { fetchFeedLines, feedUrl, isConfigured, login, baseUrl } from '../_shared/mlspin-auth.ts';
import {
  applyGeocodes,
  insertMissingSold,
  openSoldDb,
  recordSoldRun,
  soldDbConfigured,
  writeSoldBatch,
  type Geocode,
  type GeocodeLookup,
  type SoldSql,
} from '../_shared/soldDb.ts';

const DEFAULT_PROP_TYPES = ['SF', 'CC', 'MF', 'RN'];
// Rows per upsert. Large enough that 8,500 single-family listings is a handful
// of round trips, small enough to stay clear of the request body limit.
const BATCH = 500;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * The `role` claim of the caller's key.
 *
 * The gateway has already verified the signature — functions deploy with JWT
 * verification on — so this only reads which key it was. The anon key is in
 * every visitor's browser; the service role key is not.
 */
const callerRole = (req: Request): string | null => {
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const payload = token.split('.')[1];
    if (!payload) return null;
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof claims.role === 'string' ? claims.role : null;
  } catch {
    return null;
  }
};

/** A located row of idx_geocodes. */
interface GeocodeRow {
  address_key: string;
  lat: number;
  lon: number;
  precision: string | null;
}

/** PostgREST puts an `in` list in the URL, so a long one is asked for in pieces. */
const KEYS_PER_REQUEST = 100;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  if (!isConfigured()) {
    return json(
      { error: 'MLS PIN credentials are not configured (MLSPIN_USERNAME, MLSPIN_PASSWORD, MLSPIN_IDX_USER_ID)' },
      500
    );
  }

  let propTypes = DEFAULT_PROP_TYPES;
  let syncOffices = false;
  // Which feed to pull. 'active' is the default because it is what /search
  // shows by default and what must never go stale; 'sold' is the past year of
  // closings, which changes far more slowly.
  let feed: 'active' | 'sold' = 'active';
  /*
   * Row window, for feeds too large to ingest in one invocation.
   *
   * The sold single-family feed is 45,000 rows and exceeds the Edge Function's
   * resource budget in a single pass even when streamed — the cost scales with
   * rows, not just bytes. `offset`/`limit` let the schedule walk it in slices.
   * The active feeds are small enough that they never use this.
   */
  let offset = 0;
  let limit = Number.POSITIVE_INFINITY;
  /** Run the sold retention sweep. See the note where it is used. */
  let prune = false;
  /** The two CockroachDB-only modes. See the header. */
  let importArchive = false;
  let soldGeocodes = false;
  try {
    const body = await req.json();
    importArchive = Boolean(body?.importArchive);
    soldGeocodes = Boolean(body?.soldGeocodes);
    if (Array.isArray(body?.propTypes) && body.propTypes.length) propTypes = body.propTypes;
    syncOffices = Boolean(body?.offices);
    if (body?.feed === 'sold') feed = 'sold';
    if (Number.isFinite(body?.offset)) offset = Math.max(0, Number(body.offset));
    if (Number.isFinite(body?.limit)) limit = Math.max(1, Number(body.limit));
    prune = Boolean(body?.prune);
  } catch {
    // No body is fine — the defaults above stand.
  }

  /**
   * Coordinates for a set of address keys, from idx_geocodes on this side.
   * Only located addresses come back: a row the geocoder tried and failed on is
   * not a coordinate.
   */
  const lookupGeocodes: GeocodeLookup = async (keys) => {
    const found = new Map<string, Geocode>();
    for (let i = 0; i < keys.length; i += KEYS_PER_REQUEST) {
      const { data, error } = await supabase
        .from('idx_geocodes')
        .select('address_key, lat, lon, precision')
        .in('address_key', keys.slice(i, i + KEYS_PER_REQUEST))
        .not('lat', 'is', null)
        .not('lon', 'is', null);
      if (error) throw new Error(`geocode lookup: ${error.message}`);
      for (const g of (data ?? []) as GeocodeRow[]) {
        found.set(g.address_key, { lat: Number(g.lat), lon: Number(g.lon), precision: g.precision });
      }
    }
    return found;
  };

  // ---- The CockroachDB-only modes ------------------------------------------
  if (importArchive || soldGeocodes) {
    // These read and write the kept sold data and nothing else calls them, so
    // unlike the feed sync they refuse the anon key outright.
    if (callerRole(req) !== 'service_role') return json({ error: 'Not allowed' }, 403);
    if (!soldDbConfigured('rw')) {
      return json({ error: 'The sold database is not configured (SOLD_DB_URL_RW)' }, 500);
    }

    const sold = openSoldDb('rw');
    const source = importArchive ? `archive-import ${offset}+${limit}` : 'geocodes';
    try {
      if (importArchive) {
        // PostgREST returns at most 1,000 rows however many are asked for, so a
        // larger window would come back short and look like the end of the
        // table. Ordered by the primary key so consecutive windows tile it.
        const size = Math.min(Number.isFinite(limit) ? limit : 1000, 1000);
        const { data, error } = await supabase
          .from('idx_sold_archive')
          .select('*')
          .order('mls_number', { ascending: true })
          .range(offset, offset + size - 1);
        if (error) throw new Error(`archive read: ${error.message}`);

        let seen = 0;
        let written = 0;
        const rows = data ?? [];
        for (let i = 0; i < rows.length; i += BATCH) {
          const result = await insertMissingSold(sold, rows.slice(i, i + BATCH), lookupGeocodes);
          seen += result.seen;
          written += result.written;
        }
        await recordSoldRun(sold, { source, seen, written, ok: true });
        // `more` is how the caller knows to ask for the next window.
        return json({ ok: true, mode: 'importArchive', offset, seen, written, more: rows.length === size });
      }

      // Everything geocoded since the last push that succeeded.
      const [last] = await sold<{ at: string | null }[]>`
        SELECT max(ran_at)::STRING AS at FROM idx_sold_runs WHERE source = 'geocodes' AND ok
      `;
      const since = last?.at ?? '1970-01-01T00:00:00Z';
      let seen = 0;
      let written = 0;
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from('idx_geocodes')
          .select('address_key, lat, lon, precision')
          .gt('geocoded_at', since)
          .not('lat', 'is', null)
          .not('lon', 'is', null)
          .order('address_key', { ascending: true })
          .range(from, from + 999);
        if (error) throw new Error(`geocode read: ${error.message}`);
        const page = ((data ?? []) as GeocodeRow[]).map((g) => ({
          address_key: g.address_key,
          lat: Number(g.lat),
          lon: Number(g.lon),
          precision: g.precision ?? null,
        }));
        seen += page.length;
        for (let i = 0; i < page.length; i += BATCH) {
          written += await applyGeocodes(sold, page.slice(i, i + BATCH));
        }
        if (page.length < 1000) break;
      }
      await recordSoldRun(sold, { source, seen, written, ok: true });
      return json({ ok: true, mode: 'soldGeocodes', since, seen, written });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`idx-sync ${source} failed:`, message);
      await recordSoldRun(sold, { source, seen: 0, written: 0, ok: false, error: message });
      return json({ ok: false, error: message }, 500);
    } finally {
      await sold.end({ timeout: 5 });
    }
  }

  /*
   * The second home of the sold feed, when it has been set up.
   *
   * Opened only for a sold run and only with the secret present. While BOTH
   * databases are written — until the site's reads have moved — a failure here
   * is recorded and reported but does NOT fail the run: the Supabase copy is
   * what every page still reads, and it must not go stale because the new
   * database was unreachable for a night. Tomorrow's run offers the same rows
   * again, and the diff writes whatever was missed.
   */
  let sold: SoldSql | null = null;
  let soldSeen = 0;
  let soldWritten = 0;
  let soldError: string | null = null;
  if (feed === 'sold' && soldDbConfigured('rw')) {
    try {
      sold = openSoldDb('rw');
    } catch (err) {
      soldError = err instanceof Error ? err.message : String(err);
      console.error('Could not open the sold database:', soldError);
    }
  }

  /** Close out the sold database's part of this run. Safe to call when there is none. */
  const finishSold = async () => {
    if (!sold) return null;
    await recordSoldRun(sold, {
      source: `sold-feed ${propTypes.join(',')} ${offset}+${Number.isFinite(limit) ? limit : 'all'}`,
      seen: soldSeen,
      written: soldWritten,
      ok: soldError === null,
      error: soldError,
    });
    await sold.end({ timeout: 5 }).catch(() => {});
    return { seen: soldSeen, written: soldWritten, error: soldError };
  };

  const startedAt = new Date().toISOString();
  const { data: run } = await supabase
    .from('idx_sync_runs')
    .insert({ started_at: startedAt })
    .select('id')
    .single();

  let upserted = 0;
  let deleted = 0;
  /** Sold rows copied into idx_sold_archive this run. */
  let archived = 0;

  try {
    const cookie = await login();

    for (const propType of propTypes) {
      /*
       * Streamed, not buffered. See fetchFeedLines — the sold single-family
       * feed is 66 MB and holding it plus its parsed rows killed the worker.
       * Rows are parsed and flushed a batch at a time, so peak memory does not
       * depend on how big the feed is.
       */
      let parse: ((line: string) => IdxListing | null) | null = null;
      let batch: Record<string, unknown>[] = [];
      let seen = 0;
      let lineNo = 0;

      const toRow = (l: IdxListing) => ({
        mls_number: l.mlsNumber,
        status: l.status,
        prop_type: l.propType ?? propType,
        address: l.address,
        street_no: l.streetNo,
        street_name: l.streetName,
        unit_no: l.unitNo,
        town_num: l.townNum,
        town: l.town,
        state: l.state,
        zip: l.zip,
        list_price: l.listPrice,
        sale_price: l.salePrice,
        bedrooms: l.bedrooms,
        full_baths: l.fullBaths,
        half_baths: l.halfBaths,
        living_area: l.livingArea,
        year_built: l.yearBuilt,
        style: l.style,
        remarks: l.remarks,
        list_office_id: l.listOfficeId,
        list_agent_id: l.listAgentId,
        photo_count: l.photoCount,
        settled_date: l.settledDate,
        feed,
        total_rooms: l.totalRooms,
        lot_size: l.lotSize,
        acres: l.acres,
        garage_spaces: l.garageSpaces,
        parking_spaces: l.parkingSpaces,
        basement: l.basement,
        waterfront: l.waterfront,
        adult_community: l.adultCommunity,
        hoa: l.hoa,
        hoa_fee: l.hoaFee,
        taxes: l.taxes,
        tax_year: l.taxYear,
        neighborhood: l.neighborhood,
        color: l.color,
        num_units: l.numUnits,
        unit_level: l.unitLevel,
        date_available: l.dateAvailable,
        sqft_above_grade: l.sqftAboveGrade,
        sqft_below_grade: l.sqftBelowGrade,
        heating: l.heating,
        cooling: l.cooling,
        water: l.water,
        sewer: l.sewer,
        hot_water: l.hotWater,
        appliances: l.appliances,
        flooring: l.flooring,
        interior_features: l.interiorFeatures,
        exterior_features: l.exteriorFeatures,
        exterior: l.exterior,
        construction: l.construction,
        roof_material: l.roofMaterial,
        basement_feature: l.basementFeature,
        garage_parking: l.garageParking,
        parking_feature: l.parkingFeature,
        lot_description: l.lotDescription,
        electric_feature: l.electricFeature,
        energy_features: l.energyFeatures,
        road_type: l.roadType,
        laundry_features: l.laundryFeatures,
        pets_allowed: l.petsAllowed,
        pool_description: l.poolDescription,
        unit_placement: l.unitPlacement,
        waterfront_desc: l.waterfrontDesc,
        waterview_features: l.waterviewFeatures,
        year_built_descrp: l.yearBuiltDescrp,
        prop_subtype: l.propSubtype,
        synced_at: startedAt,
      });

      const flush = async () => {
        if (batch.length === 0) return;
        const { error } = await supabase
          .from('idx_listings')
          .upsert(batch, { onConflict: 'mls_number' });
        if (error) throw new Error(`${propType}/${feed} upsert: ${error.message}`);
        upserted += batch.length;

        /*
         * ARCHIVE BEFORE DELETING — and archive THIS BATCH, not the archive.
         *
         * MLS PIN's sold feed is a rolling one-year window and the sweep below
         * models that by deleting what has aged out, so without this call a day
         * of closings leaves the database every night and nothing keeps a copy.
         * A comparable-sales estimate in a thin town (Dover: 76 single-family
         * closings in the whole window) needs two or three years, and depth can
         * only be accumulated forward.
         *
         * Per batch, by MLS number, because the version that copied every
         * in-scope row on every slice timed out on fifteen of sixteen runs on
         * 2026-09-27 — see 20260927090000_idx_archive_by_batch.sql. This way the
         * work per call is bounded by BATCH rather than by the size of the
         * archive, the rows are still in cache from the upsert a moment ago, and
         * a slice that dies halfway has still archived every batch before the
         * one that failed. Every sold row passes through here every night it is
         * in the feed, so nothing is offered to the archive less often than it
         * was.
         *
         * Rentals are skipped here as well as in the function: the archive never
         * takes one, and asking about seven thousand of them was pure cost.
         *
         * Allowed to fail the run: losing a day of closings permanently is worse
         * than a red sync, and unlike a display failure it cannot be fixed by
         * re-running tomorrow.
         */
        if (feed === 'sold' && propType !== 'RN') {
          const { data: copied, error: archiveError } = await supabase.rpc('idx_archive_sold', {
            p_mls: batch.map((row) => row.mls_number),
          });
          if (archiveError) throw new Error(`${propType}/sold archive: ${archiveError.message}`);
          archived += Number(copied ?? 0);
        }

        /*
         * And the same batch to the database that keeps everything: every
         * town, every column, rentals included, never deleted. Only rows that
         * are new or changed are written — see writeSoldBatch — so on an
         * ordinary night this is one small read per batch.
         *
         * After the first failure the rest of the run stops offering: a
         * database that refused one batch will refuse the next two hundred, and
         * each attempt is a ten-second connect timeout this run cannot afford.
         */
        if (sold && soldError === null) {
          try {
            const result = await writeSoldBatch(sold, batch, lookupGeocodes);
            soldSeen += result.seen;
            soldWritten += result.written;
          } catch (err) {
            soldError = err instanceof Error ? err.message : String(err);
            console.error(`${propType}/sold: the sold database refused a batch:`, soldError);
          }
        }

        batch = [];
      };

      for await (const line of fetchFeedLines(cookie, feedUrl(propType, feed === 'sold'))) {
        if (!parse) {
          parse = rowParser(line);
          continue;
        }
        /*
         * The window is counted in LINES, and the skip happens before parsing.
         *
         * Counting parsed rows instead meant slice 5 of the sold single-family
         * feed still parsed the 32,000 rows ahead of it just to find its
         * starting point — which is what exhausted the worker. Line position is
         * deterministic and identical across slices, so the slices still tile
         * the file exactly.
         */
        lineNo += 1;
        if (lineNo <= offset) continue;
        if (lineNo > offset + limit) break;

        const listing = parse(line);
        if (!listing) continue;
        seen += 1;
        batch.push(toRow(listing));
        if (batch.length >= BATCH) await flush();
      }
      await flush();

      /*
       * An empty result is far more likely to be a broken session or a changed
       * export than a property type with no listings in all of Massachusetts —
       * so it aborts rather than letting the delete below run against nothing.
       *
       * Only for a full pass, though: a slice starting past the end of the file
       * legitimately sees zero rows, and the schedule always includes one.
       */
      if (seen === 0 && offset === 0) {
        throw new Error(`${propType}/${feed}: parsed to zero listings — refusing to delete`);
      }

      // Every sold batch was archived inside flush(), before this point — so
      // the sweep below can never delete a row the archive has not been offered.

      /*
       * DELETION DIFFERS BY FEED, because the two feeds behave differently.
       *
       * ACTIVE is diffed against the whole file: a listing that leaves it has
       * sold, expired or been withdrawn and must stop being displayed. That is
       * a compliance requirement, and it works because an active feed is always
       * ingested in one pass, so anything untouched really is gone.
       *
       * SOLD cannot be diffed that way — it is walked in slices, so within any
       * one run most rows are legitimately untouched. It also does not need to
       * be: MLS PIN's sold feed is a rolling one-year window, so rows leave it
       * by ageing out rather than by being pulled. A retention sweep models
       * exactly that, and is self-healing: once every slice has run, anything
       * still carrying an old synced_at is genuinely absent from the feed.
       *
       * Three days rather than one, so a single failed slice does not delete
       * real listings.
       */
      if (feed === 'active' || prune) {
        const staleBefore =
          feed === 'active'
            ? startedAt
            : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

        let del = supabase
          .from('idx_listings')
          .delete()
          .eq('feed', feed)
          .lt('synced_at', staleBefore);

        // Scoped to the property type for active runs — without it, a
        // single-family run deletes every condo. The sold sweep is deliberately
        // across types, because it runs once after the slices.
        if (feed === 'active') del = del.eq('prop_type', propType);

        const { data: gone, error: delError } = await del.select('mls_number');
        if (delError) throw new Error(`${propType}/${feed} delete: ${delError.message}`);
        deleted += gone?.length ?? 0;
      }
    }

    if (syncOffices) {
      // Public endpoint — no session needed, which is why it is not routed
      // through fetchFeed. ID|NAME|PHONE.
      const res = await fetch(`${baseUrl()}/tools/idx/idxDownloads/offices.asp`);
      if (!res.ok) throw new Error(`offices.asp: HTTP ${res.status}`);
      const lines = (await res.text()).split(/\r\n|\n|\r/).filter((l) => l.trim() !== '');
      const offices = lines.slice(1).map((line) => {
        const [id, name, phone] = line.split('|');
        return { office_id: (id ?? '').trim(), name: (name ?? '').trim(), phone: (phone ?? '').trim() || null };
      }).filter((o) => o.office_id && o.name);

      for (let i = 0; i < offices.length; i += BATCH) {
        const { error } = await supabase
          .from('idx_offices')
          .upsert(offices.slice(i, i + BATCH), { onConflict: 'office_id' });
        if (error) throw new Error(`offices upsert: ${error.message}`);
      }
    }

    await supabase
      .from('idx_sync_runs')
      .update({
        finished_at: new Date().toISOString(),
        ok: true,
        rows_upserted: upserted,
        rows_deleted: deleted,
      })
      .eq('id', run?.id);

    const soldDb = await finishSold();
    return json({ ok: true, feed, propTypes, offset, upserted, deleted, archived, soldDb });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const soldDb = await finishSold();

    await supabase
      .from('idx_sync_runs')
      .update({
        finished_at: new Date().toISOString(),
        ok: false,
        rows_upserted: upserted,
        rows_deleted: deleted,
        error: message,
      })
      .eq('id', run?.id);

    // Logged and returned, but the credentials never appear in either — the
    // messages in mlspin-auth deliberately name the env var rather than echo
    // its value.
    console.error('idx-sync failed:', message);
    return json({ ok: false, error: message, upserted, deleted, archived, soldDb }, 500);
  }
});
