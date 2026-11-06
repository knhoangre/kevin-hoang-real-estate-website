/**
 * market-unsubscribe — RFC 8058 one-click unsubscribe for the monthly market
 * report, the address in its List-Unsubscribe header.
 *
 * Its own function because a mail client POSTs here with no key at all, so this
 * one is deployed with verify_jwt off (see supabase/config.toml). The token in
 * the address is the whole credential: a random UUID that only the subscriber's
 * own emails carry, and all it can do is stop those emails.
 *
 *   POST ?token=…   unsubscribes. The body is "List-Unsubscribe=One-Click".
 *   GET  ?token=…   someone opened the address in a browser: forwarded to the
 *                   site's page, which asks before it does anything, because a
 *                   link scanner fetching every address in an email must not be
 *                   what unsubscribes a person.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { isToken, unsubscribeUrl } from '../_shared/marketEmail.ts';

serve(async (req) => {
  const token = new URL(req.url).searchParams.get('token');
  if (!isToken(token)) return new Response('That link is not complete.', { status: 400 });

  if (req.method === 'GET') {
    return new Response(null, { status: 303, headers: { Location: unsubscribeUrl(token) } });
  }
  if (req.method !== 'POST') return new Response('POST or GET only', { status: 405 });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await db
    .from('market_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('token', token)
    .is('unsubscribed_at', null);
  if (error) {
    console.error('market-unsubscribe:', error);
    return new Response('Something went wrong.', { status: 500 });
  }
  return new Response('Unsubscribed.', { status: 200 });
});
