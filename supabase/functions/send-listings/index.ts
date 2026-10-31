/**
 * Homes a client may be interested in, as a text and as an email.
 *
 * ADMIN ONLY, and checked as such on every call. Two actions, both addressed by
 * the row's ID and nothing else, the same shape as `showing-schedule`:
 *
 *   preview  Returns the message as a text and as the email's HTML. SENDS NOTHING
 *            and changes nothing. "Generate text message" calls this: Kevin copies
 *            the text, or opens it in Messages, and sends it from his own phone.
 *
 *   send     Emails it to everyone on the row who has an address — one message,
 *            all of them on the To line — with Kevin on cc, and stamps `sent_at`.
 *
 * The recipient and every word are read here, from the database, so this cannot
 * be used to mail an arbitrary person an arbitrary thing under Kevin's name.
 *
 * THE HOMES ARE RE-READ FROM THE FEED EVERY TIME, so a price cut since the row was
 * saved is the price in the message, and a home that has left the feed is left
 * out and named in `notice` rather than offered to a client.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@3.1.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { fetchEmailListing, type EmailListing } from '../_shared/listingEmail.ts';
import {
  leftOutNotice,
  numbersOf,
  peopleOf,
  renderEmailText,
  renderHtml,
  renderText,
  savedAddress,
  subjectFor,
} from '../_shared/listingSend.ts';
import { AGENT } from '../_shared/showingReminders.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { action, id } = await req.json();

    if (action !== 'preview' && action !== 'send') {
      return json({ error: 'Unknown action' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return json({ error: 'Server configuration error' }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // The caller, resolved from their JWT against auth — never from the body.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authError } = jwt
      ? await admin.auth.getUser(jwt)
      : { data: null, error: null };
    const user = authError ? null : auth?.user ?? null;
    if (!user) return json({ error: 'Not signed in' }, 401);
    if (user.app_metadata?.is_admin !== true) {
      console.warn('Non-admin called send-listings:', user.id);
      return json({ error: 'Not allowed' }, 403);
    }

    if (typeof id !== 'string' || !UUID.test(id)) {
      return json({ error: 'Unknown message' }, 400);
    }

    const { data: row, error: rowError } = await admin
      .from('listing_sends')
      .select('id, clients, homes, note')
      .eq('id', id)
      .maybeSingle();
    if (rowError) {
      console.error('Listing send lookup failed:', rowError.message);
      return json({ error: 'Lookup failed' }, 500);
    }
    if (!row) return json({ error: 'That message no longer exists.' }, 404);

    // One at a time and in Kevin's order. At most twenty, and only ever pressed
    // by one person, so a batched read would save nothing worth the second path.
    const numbers = numbersOf(row.homes);
    const found = await Promise.all(numbers.map((mls) => fetchEmailListing(admin, mls)));
    const homes = found.filter((home): home is EmailListing => home !== null);
    const notice = leftOutNotice(
      numbers.filter((_, i) => found[i] === null).map((mls) => savedAddress(row.homes, mls))
    );

    if (homes.length === 0) {
      return json(
        { error: 'None of these homes are in the MLS feed any more. Add another and try again.' },
        400
      );
    }

    const people = peopleOf(row.clients);
    const names = people.map((p) => p.name);
    const note = row.note?.trim() || null;
    const subject = subjectFor(homes);
    const text = renderText(names, note, homes);
    const html = renderHtml(names, note, homes);

    if (action === 'preview') {
      return json({ subject, text, html, notice });
    }

    // ---- send -------------------------------------------------------------
    // Once each: a couple who share an address get one copy, not two.
    const to = [...new Set(people.flatMap((p) => (p.email ? [p.email.toLowerCase()] : [])))];
    if (to.length === 0) {
      return json(
        { sent: false, error: 'Nobody on this message has an email address. Add one, or send it as a text.' },
        400
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY');
      return json({ sent: false, error: 'Email is not configured.' }, 500);
    }

    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: 'Kevin Hoang <contact@kevinhoang.co>',
      to,
      // Kevin gets the copy the clients got, so "what did I send them" is
      // answered by his own inbox.
      ...(to.includes(AGENT.email) ? {} : { cc: [AGENT.email] }),
      reply_to: AGENT.email,
      subject,
      html,
      text: renderEmailText(names, note, homes),
    });
    // The SDK reports an API refusal in `error` rather than throwing, so a
    // bounced domain or a bad key would otherwise be reported as sent.
    if (result?.error) {
      console.error('Resend refused the listings:', result.error);
      return json({ sent: false, error: 'The email could not be sent.' }, 502);
    }

    const sentAt = new Date().toISOString();
    const { error: stampError } = await admin
      .from('listing_sends')
      .update({ sent_at: sentAt, updated_at: sentAt })
      .eq('id', id);
    // The mail did go; a failed stamp is logged, not reported as a failed send.
    if (stampError) console.error('Could not stamp sent_at:', stampError.message);

    return json({ sent: true, sentAt, to, notice });
  } catch (err) {
    console.error('send-listings failed:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
