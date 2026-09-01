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
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { rowParser, type IdxListing } from '../_shared/idx.ts';
import { fetchFeedLines, feedUrl, isConfigured, login, baseUrl } from '../_shared/mlspin-auth.ts';

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
  try {
    const body = await req.json();
    if (Array.isArray(body?.propTypes) && body.propTypes.length) propTypes = body.propTypes;
    syncOffices = Boolean(body?.offices);
    if (body?.feed === 'sold') feed = 'sold';
    if (Number.isFinite(body?.offset)) offset = Math.max(0, Number(body.offset));
    if (Number.isFinite(body?.limit)) limit = Math.max(1, Number(body.limit));
    prune = Boolean(body?.prune);
  } catch {
    // No body is fine — the defaults above stand.
  }

  const startedAt = new Date().toISOString();
  const { data: run } = await supabase
    .from('idx_sync_runs')
    .insert({ started_at: startedAt })
    .select('id')
    .single();

  let upserted = 0;
  let deleted = 0;

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

    return json({ ok: true, feed, propTypes, offset, upserted, deleted });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

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
    return json({ ok: false, error: message, upserted, deleted }, 500);
  }
});
