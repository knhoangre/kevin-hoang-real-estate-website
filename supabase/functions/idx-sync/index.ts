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
import { parseIdxFeed } from '../_shared/idx.ts';
import { fetchFeed, feedUrl, isConfigured, login, baseUrl } from '../_shared/mlspin-auth.ts';

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
  try {
    const body = await req.json();
    if (Array.isArray(body?.propTypes) && body.propTypes.length) propTypes = body.propTypes;
    syncOffices = Boolean(body?.offices);
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
      const text = await fetchFeed(cookie, feedUrl(propType));
      const listings = parseIdxFeed(text);

      // See note 2 above: an empty result is far more likely to be a broken
      // session or a changed export than a property type with no listings in
      // the whole of Massachusetts.
      if (listings.length === 0) {
        throw new Error(`${propType}: feed parsed to zero listings — refusing to delete`);
      }

      const rows = listings.map((l) => ({
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
        synced_at: startedAt,
      }));

      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await supabase
          .from('idx_listings')
          .upsert(rows.slice(i, i + BATCH), { onConflict: 'mls_number' });
        if (error) throw new Error(`${propType} upsert: ${error.message}`);
        upserted += Math.min(BATCH, rows.length - i);
      }

      // Anything of THIS type the run did not touch is gone from the feed.
      const { data: gone, error: delError } = await supabase
        .from('idx_listings')
        .delete()
        .eq('prop_type', propType)
        .lt('synced_at', startedAt)
        .select('mls_number');
      if (delError) throw new Error(`${propType} delete: ${delError.message}`);
      deleted += gone?.length ?? 0;
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

    return json({ ok: true, propTypes, upserted, deleted });
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
