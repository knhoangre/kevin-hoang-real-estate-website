/**
 * submit-valuation-request — the form on /home-valuation.
 *
 * Public: it takes the anon key, like submit-contact, because the person asking
 * has no account. What it does with a request:
 *
 *   1. Files the person in the CRM through crm_upsert_contact(), the one
 *      find-or-create (submit-contact still carries its own copy; this is
 *      deliberately not another), tagged Seller, with the source
 *      "Home Valuation Request & <street, town>". p_prefer_new is TRUE: the
 *      person typed these details about themselves.
 *   2. Stores the request as a contact message, so it is in the CRM's inbox.
 *   3. Emails Kevin, with reply_to set to the person (spelled reply_to:
 *      resend@3.1.0 drops replyTo), and the person a short note that it arrived.
 *
 * The recipient is fixed here and nothing in the request can change it. Two
 * guards keep a public form that sends email from being used to send email: a
 * person is sent at most one confirmation a day, and past FLOOD requests in an
 * hour the requests are still stored but nothing is mailed, which also keeps
 * Resend's 100-a-day free allowance for the mail that matters.
 *
 * A failed CRM write never fails the request if the email to Kevin went, and a
 * failed email never fails it if the CRM has it: either way Kevin can see it,
 * and telling the person it failed would only make them send it twice.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@3.1.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import {
  confirmationEmail,
  kevinEmail,
  messageText,
  readRequest,
  sourceLabel,
} from '../_shared/valuationRequest.ts';

const KEVIN = 'knhoangre@gmail.com';
const FROM = 'Kevin Hoang <contact@kevinhoang.co>';
const FLOOD = 20;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'The request was not JSON.' }, 400);
  }
  const read = readRequest(body);
  if (!read.ok) return 'bot' in read ? json({ ok: true }) : json({ error: read.error }, 400);
  const r = read.request;

  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) return json({ error: 'Server configuration error: RESEND_API_KEY is not set' }, 500);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const since = (ms: number) => new Date(Date.now() - ms).toISOString();
  const isRequest = 'Home valuation request for %';

  const { count: lastHour } = await db
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .like('message', isRequest)
    .gte('created_at', since(3_600_000));
  const flooded = (lastHour ?? 0) >= FLOOD;

  // --- the CRM ------------------------------------------------------------------
  let filed = false;
  let confirmedToday = false;
  try {
    const { data: contactId, error } = await db.rpc('crm_upsert_contact', {
      p_first: r.firstName,
      p_last: r.lastName,
      p_email: r.email || null,
      p_phone: r.phone || null,
      p_source: sourceLabel(r),
      p_tag: 'Seller',
      p_prefer_new: true,
    });
    if (error) throw error;
    if (contactId == null) throw new Error('crm_upsert_contact filed nobody');

    const { data: contact, error: contactError } = await db
      .from('contacts')
      .select('first_name_id, last_name_id, email_id, phone_id')
      .eq('id', contactId)
      .single();
    if (contactError) throw contactError;

    if (contact.email_id) {
      const { count } = await db
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('email_id', contact.email_id)
        .like('message', isRequest)
        .gte('created_at', since(86_400_000));
      confirmedToday = (count ?? 0) > 0;
    }

    const { data: source } = await db.from('contact_sources').select('id').eq('source', sourceLabel(r)).maybeSingle();
    const { error: messageError } = await db.from('contact_messages').insert({
      first_name_id: contact.first_name_id,
      last_name_id: contact.last_name_id,
      email_id: contact.email_id,
      phone_id: contact.phone_id,
      message: messageText(r),
      source_id: source?.id ?? null,
    });
    if (messageError) throw messageError;
    filed = true;
  } catch (err) {
    console.error('submit-valuation-request: could not file the request in the CRM:', err);
  }

  if (flooded) {
    console.warn(`submit-valuation-request: ${lastHour} requests in the last hour; stored, not mailed`);
    return filed ? json({ ok: true }) : json({ error: 'The request could not be saved.' }, 503);
  }

  // --- the emails -----------------------------------------------------------------
  const resend = new Resend(resendKey);
  const toKevin = kevinEmail(r);
  const sent = await resend.emails.send({
    from: FROM,
    to: [KEVIN],
    ...(r.email ? { reply_to: r.email } : {}),
    subject: toKevin.subject,
    html: toKevin.html,
    text: toKevin.text,
  });
  if (sent.error) {
    console.error('submit-valuation-request: the email to Kevin failed:', sent.error);
    if (!filed) return json({ error: 'The request could not be sent.' }, 502);
  }

  if (r.email && !confirmedToday) {
    const note = confirmationEmail(r);
    const confirmed = await resend.emails.send({
      from: FROM,
      to: [r.email],
      reply_to: KEVIN,
      subject: note.subject,
      html: note.html,
      text: note.text,
    });
    if (confirmed.error) console.error('submit-valuation-request: the confirmation failed:', confirmed.error);
  }

  return json({ ok: true });
});
