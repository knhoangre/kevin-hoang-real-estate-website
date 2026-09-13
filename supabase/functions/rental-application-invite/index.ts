/**
 * Rental application invites.
 *
 * This function is the entire security boundary around /apply/<token>. The
 * `rental_application_invites` table has no SELECT policy for anon or
 * authenticated — only `public.is_admin()` — so a token can be checked nowhere
 * else, and the table cannot be enumerated.
 *
 * Three actions:
 *
 *   resolve  public. Token in, and either the label/property (so the landing
 *            page can say what is being applied for before sign-up) or a flat
 *            refusal. Nothing else ever leaves.
 *
 *   claim    requires the caller's JWT. Verifies the invite, then creates or
 *            returns THAT user's draft application for it.
 *
 *   send     admin only, and checked as such — resolve is public and claim
 *            needs only a session, so the one action that sends mail cannot
 *            rely on either. It takes the invite's ID rather than an address,
 *            so the recipient is looked up here and this can never be used to
 *            mail an arbitrary person.
 *
 * Every failure — unknown token, expired, revoked, claimed by somebody else —
 * returns the identical `{ valid: false }`. Distinguishing them would turn this
 * into an oracle for guessing tokens.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@3.1.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

/** The one refusal. Callers cannot tell these cases apart, and that is the point. */
const INVALID = { valid: false } as const;

/**
 * The property as one line. A deliberate mirror of `formatProperty` in
 * src/lib/rentalApplication.ts — the email cannot import from the app bundle,
 * and the two disagreeing would mean the address in the email is not the address
 * on the page. Same rule as the town/ZIP normalisation shared between
 * sync-listings.mjs and PropertiesList's fromRow.
 */
const formatProperty = (row: {
  property_address?: string | null;
  unit?: string | null;
  property_town?: string | null;
  property_state?: string | null;
  property_zip?: string | null;
}): string => {
  const street = [row.property_address?.trim(), row.unit?.trim() && `Unit ${row.unit.trim()}`]
    .filter(Boolean)
    .join(' · ');
  const region = [row.property_state?.trim(), row.property_zip?.trim()].filter(Boolean).join(' ');
  const place = [row.property_town?.trim(), region].filter(Boolean).join(', ');
  return [street, place].filter(Boolean).join(', ');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { action, token, inviteId, origin } = await req.json();

    if (action !== 'resolve' && action !== 'claim' && action !== 'send') {
      return json({ error: 'Unknown action' }, 400);
    }
    if (action !== 'send' && (typeof token !== 'string' || token.length < 16 || token.length > 128)) {
      return json(INVALID);
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

    /**
     * The caller, resolved from their JWT against auth. Null when there is no
     * usable session. `app_metadata.is_admin` is the same flag public.is_admin()
     * reads out of raw_app_meta_data and AuthContext reads in the browser — and
     * it comes from auth here, not from anything the caller sent.
     */
    const caller = async () => {
      const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
      if (!jwt) return null;
      const { data, error } = await admin.auth.getUser(jwt);
      if (error || !data?.user) return null;
      return data.user;
    };

    // ---- send -------------------------------------------------------------
    // Handled before the token lookup below: this action is addressed by the
    // invite's id, and the admin check has to come before anything else.
    if (action === 'send') {
      const user = await caller();
      if (!user) return json({ error: 'Not signed in' }, 401);
      if (user.app_metadata?.is_admin !== true) {
        console.warn('Non-admin attempted to send an invite:', user.id);
        return json({ error: 'Not allowed' }, 403);
      }

      if (typeof inviteId !== 'string' || !/^[0-9a-f-]{36}$/i.test(inviteId)) {
        return json({ error: 'Unknown invite' }, 400);
      }

      const { data: row, error: rowError } = await admin
        .from('rental_application_invites')
        .select(
          'token, label, property_address, unit, property_town, property_state, property_zip, monthly_rent, invitee_email, expires_at, revoked_at'
        )
        .eq('id', inviteId)
        .maybeSingle();

      if (rowError) {
        console.error('Invite lookup failed:', rowError.message);
        return json({ error: 'Lookup failed' }, 500);
      }
      if (!row) return json({ sent: false, error: 'That link no longer exists.' }, 404);
      if (row.revoked_at) return json({ sent: false, error: 'That link has been revoked.' }, 400);
      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        return json({ sent: false, error: 'That link has expired.' }, 400);
      }
      if (!row.invitee_email) {
        return json({ sent: false, error: 'That link has no email address on it.' }, 400);
      }

      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        console.error('Missing RESEND_API_KEY');
        return json({ sent: false, error: 'Email is not configured yet.' }, 500);
      }

      // The origin comes from the admin's own browser rather than being
      // hardcoded, so a preview deployment mails a link to itself. Anything
      // that is not one of ours falls back to the canonical site.
      const allowed = /^https:\/\/([a-z0-9-]+\.)*kevinhoang\.co$/i;
      const base =
        typeof origin === 'string' && allowed.test(origin) ? origin : 'https://kevinhoang.co';
      const link = `${base}/apply/${row.token}`;
      const property = row.label || formatProperty(row);
      const rent = row.monthly_rent ? `$${Number(row.monthly_rent).toLocaleString('en-US')}` : '';

      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'Kevin Hoang <contact@kevinhoang.co>',
          to: [row.invitee_email],
          replyTo: 'knhoangre@gmail.com',
          subject: property ? `Rental application — ${property}` : 'Your rental application',
          html: `<!DOCTYPE html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;background:#faf8f5">
    <h1 style="font-size:20px;margin:0 0 16px">Your rental application</h1>
    <p style="margin:0 0 12px">Hello,</p>
    <p style="margin:0 0 12px">
      Here is your application${property ? ` for <strong>${property}</strong>` : ''}${rent ? `, listed at ${rent} a month` : ''}.
      Use the link below to create an account and fill it in. Your answers save as you go, so you
      can stop and come back.
    </p>
    <p style="margin:0 0 20px">
      You can also upload documents there — a photo ID, recent pay stubs, or a completed
      application you already have on another form. Please do not send a Social Security number
      or a bank account number; neither is asked for or needed.
    </p>
    <p style="margin:0 0 24px">
      <a href="${link}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:600">Start your application</a>
    </p>
    <p style="margin:0 0 12px;font-size:13px;color:#555">
      Or paste this into your browser:<br />
      <span style="word-break:break-all">${link}</span>
    </p>
    <p style="margin:0;font-size:13px;color:#555">
      This link is for you — please do not forward it. If you were not expecting this email, you
      can ignore it.
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:#555">
      Kevin Hoang · (860) 682-2251 · knhoangre@gmail.com
    </p>
  </body>
</html>`,
        });
      } catch (err) {
        console.error('Invite email failed:', err);
        return json({ sent: false, error: 'The email could not be sent.' }, 502);
      }

      const { error: stampError } = await admin
        .from('rental_application_invites')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', inviteId);
      // A failed stamp is not a failed send. Say it went, log the rest.
      if (stampError) console.error('Could not stamp sent_at:', stampError.message);

      return json({ sent: true });
    }

    const { data: invite, error: inviteError } = await admin
      .from('rental_application_invites')
      .select(
        'id, label, property_address, unit, property_town, property_state, property_zip, monthly_rent, invitee_email, expires_at, revoked_at'
      )
      .eq('token', token)
      .maybeSingle();

    if (inviteError) {
      console.error('Invite lookup failed:', inviteError.message);
      return json({ error: 'Lookup failed' }, 500);
    }
    if (!invite) return json(INVALID);
    if (invite.revoked_at) return json(INVALID);
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return json(INVALID);

    // What the invite is FOR. Safe to show before authentication: it is what
    // the admin already put in a message to this person.
    const offer = {
      label: invite.label,
      propertyAddress: invite.property_address,
      unit: invite.unit,
      propertyTown: invite.property_town,
      propertyState: invite.property_state,
      propertyZip: invite.property_zip,
      monthlyRent: invite.monthly_rent,
      // Prefills the form's email field so the applicant supplies only their
      // name and phone. It is the address the admin already mailed this link
      // to, and it leaves here only for a token that resolved.
      inviteeEmail: invite.invitee_email,
    };

    // Who, if anyone, already claimed it.
    const { data: existing, error: existingError } = await admin
      .from('rental_applications')
      .select('id, applicant_user_id, status')
      .eq('invite_id', invite.id)
      .maybeSingle();

    if (existingError) {
      console.error('Application lookup failed:', existingError.message);
      return json({ error: 'Lookup failed' }, 500);
    }

    // ---- resolve ----------------------------------------------------------
    if (action === 'resolve') {
      // `claimed` is deliberately coarse — true means "somebody has started
      // this", not who. The signed-in owner learns it is theirs from `claim`.
      return json({ valid: true, ...offer, claimed: Boolean(existing) });
    }

    // ---- claim ------------------------------------------------------------
    const user = await caller();
    if (!user) return json({ error: 'Not signed in' }, 401);

    if (existing) {
      // Theirs — hand it back, so a returning applicant resumes their draft.
      if (existing.applicant_user_id === user.id) {
        return json({ valid: true, ...offer, applicationId: existing.id, status: existing.status });
      }
      // Somebody else's. Same refusal as an unknown token: confirming that a
      // valid invite exists but belongs to another person is not this
      // stranger's business.
      return json(INVALID);
    }

    const { data: created, error: createError } = await admin
      .from('rental_applications')
      .insert({
        invite_id: invite.id,
        applicant_user_id: user.id,
        applicant_email: user.email ?? null,
        status: 'draft',
        data: {},
      })
      .select('id, status')
      .single();

    if (createError) {
      // 23505 is the unique index on invite_id: two tabs raced, and the other
      // one won. Re-read rather than failing — if it is theirs they should get
      // it, and if it is not they get the standard refusal.
      if (createError.code === '23505') {
        const { data: raced } = await admin
          .from('rental_applications')
          .select('id, applicant_user_id, status')
          .eq('invite_id', invite.id)
          .maybeSingle();
        if (raced && raced.applicant_user_id === user.id) {
          return json({ valid: true, ...offer, applicationId: raced.id, status: raced.status });
        }
        return json(INVALID);
      }
      console.error('Application create failed:', createError.message);
      return json({ error: 'Could not start the application' }, 500);
    }

    return json({ valid: true, ...offer, applicationId: created.id, status: created.status });
  } catch (err) {
    console.error('rental-application-invite failed:', err);
    return json({ error: 'Unexpected error' }, 500);
  }
});
