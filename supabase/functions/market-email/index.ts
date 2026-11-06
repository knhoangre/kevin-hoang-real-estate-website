/**
 * market-email — the monthly market report by email.
 *
 *   subscribe    public. An email and towns; sends a confirmation (double
 *                opt-in) and always answers the same, so the endpoint cannot be
 *                used to find out whether an address is subscribed.
 *   confirm      public, by the token in the confirmation link.
 *   unsubscribe  public, by the token in every email's footer.
 *   run          service role only, daily from pg_cron: sends this month's report
 *                to whoever has not had it, at most DAILY_BATCH a day, and
 *                nothing at all until MAILING_ADDRESS is set. See
 *                _shared/marketEmail.ts for why.
 *
 * The rules and the words are in _shared/marketEmail.ts. The tables have no
 * browser grant beyond the admin's read; everything here runs on the service
 * role. A send is CLAIMED in market_email_sends before it goes, so the daily run,
 * a retry or a second press sends nobody the same month twice.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@3.1.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { SITE_ORIGIN } from '../_shared/listingEmail.ts';
import {
  CONFIRMS_PER_HOUR,
  CONFIRM_GAP_MS,
  DAILY_BATCH,
  MAILING_ADDRESS,
  confirmationEmail,
  dueFor,
  isToken,
  listUnsubscribeHeaders,
  monthlyEmail,
  readSignup,
  type MarketLatest,
} from '../_shared/marketEmail.ts';

const FROM = 'Kevin Hoang <contact@kevinhoang.co>';
const REPLY_TO = 'knhoangre@gmail.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/**
 * The role in the caller's JWT. The gateway has verified the signature
 * (verify_jwt is on), so the claim is enough, as in showing-reminders.
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'The request was not JSON.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const action = body.action;

  try {
    // ---- subscribe -----------------------------------------------------------
    if (action === 'subscribe') {
      const signup = readSignup(body);
      if (!signup.ok) return 'bot' in signup ? json({ ok: true }) : json({ error: signup.error }, 400);
      if (!resendKey) return json({ error: 'Server configuration error: RESEND_API_KEY is not set' }, 500);

      const { data: existing, error: readError } = await db
        .from('market_subscribers')
        .select('id, towns, token, confirmed_at, unsubscribed_at, confirm_sent_at')
        .eq('email', signup.email)
        .maybeSingle();
      if (readError) throw readError;

      // Towns are added, never taken away: signing up from the Newton page while
      // already getting Needham means both.
      const towns = [...new Set([...(existing?.unsubscribed_at ? [] : existing?.towns ?? []), ...signup.towns])];
      const active = existing?.confirmed_at && !existing.unsubscribed_at;

      let row = existing;
      if (existing) {
        const { error } = await db.from('market_subscribers').update({ towns }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { data, error } = await db
          .from('market_subscribers')
          .insert({ email: signup.email, towns, source: signup.source })
          .select('id, towns, token, confirmed_at, unsubscribed_at, confirm_sent_at')
          .single();
        if (error) throw error;
        row = data;
      }
      if (active || !row) return json({ ok: true });

      // Not yet confirmed (or unsubscribed and back): a confirmation, unless one
      // went to this address minutes ago or too many have gone this hour.
      const recent = row.confirm_sent_at && Date.now() - Date.parse(row.confirm_sent_at) < CONFIRM_GAP_MS;
      const { count: lastHour } = await db
        .from('market_subscribers')
        .select('id', { count: 'exact', head: true })
        .gte('confirm_sent_at', new Date(Date.now() - 3_600_000).toISOString());
      if (recent || (lastHour ?? 0) >= CONFIRMS_PER_HOUR) {
        if (!recent) console.warn(`market-email: ${lastHour} confirmations in the last hour; holding this one`);
        return json({ ok: true });
      }

      const note = confirmationEmail(row.token, towns);
      const sent = await new Resend(resendKey).emails.send({
        from: FROM,
        to: [signup.email],
        reply_to: REPLY_TO,
        subject: note.subject,
        html: note.html,
        text: note.text,
      });
      if (sent.error) {
        console.error('market-email: the confirmation failed:', sent.error);
        return json({ error: 'The confirmation email could not be sent. Please try again later.' }, 502);
      }
      await db.from('market_subscribers').update({ confirm_sent_at: new Date().toISOString() }).eq('id', row.id);
      return json({ ok: true });
    }

    // ---- confirm / unsubscribe -----------------------------------------------
    if (action === 'confirm' || action === 'unsubscribe') {
      if (!isToken(body.token)) return json({ error: 'That link is not complete.' }, 400);
      const { data: row, error } = await db
        .from('market_subscribers')
        .select('id, towns')
        .eq('token', body.token)
        .maybeSingle();
      if (error) throw error;
      if (!row) return json({ error: 'That link is not one we sent, or it has been replaced.' }, 404);
      const now = new Date().toISOString();
      const change =
        action === 'confirm' ? { confirmed_at: now, unsubscribed_at: null } : { unsubscribed_at: now };
      const { error: updateError } = await db.from('market_subscribers').update(change).eq('id', row.id);
      if (updateError) throw updateError;
      return json({ ok: true, towns: row.towns });
    }

    // ---- run -------------------------------------------------------------------
    if (action === 'run') {
      if (callerRole(req) !== 'service_role') return json({ error: 'Not allowed' }, 403);

      const res = await fetch(`${SITE_ORIGIN}/data/market-latest.json`);
      if (!res.ok) throw new Error(`market-latest.json answered ${res.status}`);
      const latest = (await res.json()) as MarketLatest;

      const { data: subscribers, error } = await db
        .from('market_subscribers')
        .select('id, email, towns, token, confirmed_at, unsubscribed_at')
        .not('confirmed_at', 'is', null)
        .is('unsubscribed_at', null);
      if (error) throw error;
      const { data: sends, error: sendsError } = await db
        .from('market_email_sends')
        .select('subscriber_id')
        .eq('month', latest.month);
      if (sendsError) throw sendsError;
      const due = dueFor(subscribers ?? [], new Set((sends ?? []).map((s) => s.subscriber_id)), DAILY_BATCH);
      const waiting = dueFor(subscribers ?? [], new Set((sends ?? []).map((s) => s.subscriber_id)), Infinity).length;

      if (!MAILING_ADDRESS.trim()) return json({ held: 'no mailing address', month: latest.month, waiting });
      if (body.dryRun === true) return json({ dryRun: true, month: latest.month, waiting, wouldSend: due.length });
      if (!resendKey) return json({ error: 'Server configuration error: RESEND_API_KEY is not set' }, 500);

      const resend = new Resend(resendKey);
      let sent = 0;
      let failed = 0;
      let skipped = 0;
      for (const s of due) {
        const mail = monthlyEmail(latest, s.towns, s.token);
        // Claimed first, even when there is nothing to send them (none of their
        // towns has this month's report), so tomorrow's run does not ask again.
        const { error: claimError } = await db
          .from('market_email_sends')
          .insert({ subscriber_id: s.id, month: latest.month, ...(mail ? {} : { error: 'no report for their towns' }) });
        if (claimError) {
          if (claimError.code !== '23505') console.error('market-email: claim failed:', claimError);
          continue;
        }
        if (!mail) {
          skipped += 1;
          continue;
        }
        const result = await resend.emails.send({
          from: FROM,
          to: [s.email],
          reply_to: REPLY_TO,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          headers: listUnsubscribeHeaders(`${supabaseUrl}/functions/v1`, s.token),
        });
        const stamp = result.error
          ? { error: String(result.error.message ?? result.error).slice(0, 500) }
          : { sent_at: new Date().toISOString() };
        await db.from('market_email_sends').update(stamp).eq('subscriber_id', s.id).eq('month', latest.month);
        if (result.error) {
          failed += 1;
          console.error('market-email: a monthly email failed:', result.error);
        } else sent += 1;
      }
      return json({ month: latest.month, sent, failed, skipped, remaining: Math.max(0, waiting - due.length) });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    console.error('market-email:', err);
    return json({ error: 'Something went wrong.' }, 500);
  }
});
