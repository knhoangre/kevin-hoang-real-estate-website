/**
 * Tell the admin that a rental application has been submitted.
 *
 * Called by the applicant's browser from `submitApplication`, after the write
 * that set the status succeeded. That is the same arrangement as every other
 * mail on this site, and it has the same failure mode: a browser closed at the
 * wrong moment sends no email. The application is still submitted and still in
 * /admin/applications — this is a notice, not the record — so the cost of a
 * missed one is that Kevin finds out by looking rather than by being told.
 *
 * THE RECIPIENT IS FIXED. It is the site's own address, hardcoded here exactly
 * as in submit-contact, and no part of the request can influence it. The caller
 * supplies an application id and nothing else that reaches the message: every
 * name, address and figure in the email is read back out of the database under
 * the service-role key. An applicant cannot use this to mail a third party, and
 * cannot use it to put text of their choosing in front of Kevin beyond what they
 * already typed into their own application.
 *
 * Who may call it: the applicant who OWNS the row, or an admin. Not any signed-in
 * user — otherwise one applicant could enumerate ids and learn who else has
 * applied from the timing of the responses.
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

/** Where the notice goes. Fixed, and deliberately not reachable from the request. */
const ADMIN_EMAIL = 'knhoangre@gmail.com';

/**
 * A second email about the same application is worth sending — an applicant can
 * edit and re-send until review starts, and the updated version is the one to
 * read. A second email about the same application THIRTY SECONDS later is a
 * double-submitted form. Ten minutes separates those two cases.
 */
const RENOTIFY_AFTER_MS = 10 * 60 * 1000;

/**
 * A subject line is plain text, and everything in it came from a form. Control
 * characters stripped and the length capped so a pasted newline cannot do
 * anything interesting on its way through a mail transport.
 */
const subjectSafe = (value: string): string =>
  value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 160);

/** Everything the applicant typed arrives here as text in an HTML document. */
const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * The tenancy address as one line, unit against the street.
 *
 * A deliberate mirror of `formatTenancyAddress` in
 * src/lib/rentalApplication.ts, for the same reason the invite function mirrors
 * formatProperty: an edge function cannot import from the app bundle, and the
 * address in the email disagreeing with the address in /admin/applications is
 * the failure this prevents.
 */
const formatTenancyAddress = (t: { propertyAddress?: string; unit?: string } | undefined): string => {
  const address = (t?.propertyAddress ?? '').trim();
  const unit = (t?.unit ?? '').trim();
  if (!unit) return address;
  const named = new RegExp(`\\bunit\\s*${unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  if (named.test(address)) return address;
  if (!address) return `Unit ${unit}`;
  const [street, ...rest] = address.split(',');
  return [`${street.trim()} · Unit ${unit}`, ...rest.map((p) => p.trim())].filter(Boolean).join(', ');
};

const row = (label: string, value: string) =>
  value
    ? `<tr><td style="padding:4px 16px 4px 0;color:#777;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:4px 0;color:#1a1a1a">${esc(value)}</td></tr>`
    : '';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { applicationId, origin } = await req.json();

    if (typeof applicationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(applicationId)) {
      return json({ error: 'Unknown application' }, 400);
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

    // The caller, resolved from their JWT against auth rather than from
    // anything they sent. Same helper as rental-application-invite.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Not signed in' }, 401);
    const { data: authData, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !authData?.user) return json({ error: 'Not signed in' }, 401);
    const user = authData.user;

    const { data: app, error: appError } = await admin
      .from('rental_applications')
      .select(
        'id, status, data, applicant_user_id, applicant_first_name, applicant_last_name, applicant_email, applicant_phone, submitted_at, admin_notified_at'
      )
      .eq('id', applicationId)
      .maybeSingle();

    if (appError) {
      console.error('Application lookup failed:', appError.message);
      return json({ error: 'Lookup failed' }, 500);
    }

    // One refusal for "does not exist" and "is not yours", so the response
    // cannot be used to find out which application ids are real.
    const isAdmin = user.app_metadata?.is_admin === true;
    if (!app || (app.applicant_user_id !== user.id && !isAdmin)) {
      return json({ error: 'Not allowed' }, 403);
    }

    // Only a submitted application. The status is read from the database, not
    // claimed by the caller — this is what makes the email's subject true.
    if (app.status !== 'submitted') {
      return json({ sent: false, reason: 'not-submitted' });
    }

    if (
      app.admin_notified_at &&
      Date.now() - new Date(app.admin_notified_at).getTime() < RENOTIFY_AFTER_MS
    ) {
      return json({ sent: false, reason: 'already-notified' });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY');
      return json({ sent: false, error: 'Email is not configured yet.' }, 500);
    }

    // Counted rather than listed: the email says how much there is to read, and
    // the page is where you read it.
    const { count: documentCount } = await admin
      .from('rental_application_documents')
      .select('id', { count: 'exact', head: true })
      .eq('application_id', applicationId);

    const allowed = /^https:\/\/([a-z0-9-]+\.)*kevinhoang\.co$/i;
    const base =
      typeof origin === 'string' && allowed.test(origin) ? origin : 'https://kevinhoang.co';
    const link = `${base}/admin/applications?id=${app.id}`;

    // Only the tenancy address is read out of the answers here; everything else
    // in the email comes from the denormalised columns beside them.
    const data = (app.data ?? {}) as { tenancy?: { propertyAddress?: string; unit?: string } };
    const name = `${app.applicant_first_name ?? ''} ${app.applicant_last_name ?? ''}`.trim();
    const property = formatTenancyAddress(data.tenancy);
    const resubmitted = Boolean(app.admin_notified_at);

    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: 'Kevin Hoang <contact@kevinhoang.co>',
        to: [ADMIN_EMAIL],
        // Replying goes to the applicant, which is almost always the next thing
        // to do. Falls back to the site address when they left it blank.
        replyTo: app.applicant_email || ADMIN_EMAIL,
        subject: subjectSafe(
          `${resubmitted ? 'Updated rental application' : 'Rental application submitted'} — ${
            name || 'an applicant'
          }${property ? ` · ${property}` : ''}`
        ),
        html: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#faf8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#1a1a1a">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto">
      <tr>
        <td style="padding-bottom:20px;border-bottom:1px solid #e7e2d9">
          <span style="font-size:15px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a1a1a">Kevin Hoang</span>
          <span style="display:block;margin-top:4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8c6b35">Rental applications</span>
        </td>
      </tr>
      <tr>
        <td style="padding-top:24px">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#1a1a1a">${
            resubmitted ? 'An application was updated and re-sent' : 'A rental application has been submitted'
          }</h1>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;font-size:14px">
            ${row('Applicant', name)}
            ${row('Email', app.applicant_email ?? '')}
            ${row('Phone', app.applicant_phone ?? '')}
            ${row('Property', property)}
            ${row('Documents', documentCount ? `${documentCount} attached` : 'none attached')}
          </table>
          <p style="margin:0 0 24px">
            <a href="${link}" style="display:inline-block;background:#c5a572;color:#0d0d0f;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px">Read the application</a>
          </p>
          <p style="margin:0;font-size:13px;color:#555">
            They can still edit it until you set the status to Reviewing, and they can add
            documents at any time. Replying to this email goes to the applicant.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-top:24px;border-top:1px solid #e7e2d9;font-size:12px;color:#777">
          <p style="margin:16px 0 0">Sent by kevinhoang.co because an application was submitted.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
      });
    } catch (err) {
      console.error('Submission notice failed:', err);
      return json({ sent: false, error: 'The email could not be sent.' }, 502);
    }

    // Stamped after a successful send, and a failed stamp still reports sent —
    // the mail did go, and saying otherwise would have the client retry it.
    const { error: stampError } = await admin
      .from('rental_applications')
      .update({ admin_notified_at: new Date().toISOString() })
      .eq('id', app.id);
    if (stampError) console.error('Could not stamp admin_notified_at:', stampError.message);

    return json({ sent: true });
  } catch (err) {
    console.error('rental-application-submitted failed:', err);
    return json({ error: 'Unexpected error' }, 500);
  }
});
