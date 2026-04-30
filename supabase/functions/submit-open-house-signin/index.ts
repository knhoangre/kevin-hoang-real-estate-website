import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@3.1.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Uppercase first letter only; rest unchanged from sign-in. */
function capitalizeFirstName(name: string): string {
  const t = name.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Apex `kevinhoang.co` 307-redirects to `www`. Many email clients do not follow
 * redirects for `<img src>`, so remote headshots break unless we use `www` directly.
 */
function canonicalWwwKevinhoangUrl(url: string): string {
  const t = url.trim();
  if (!t) return t;
  try {
    const u = new URL(t);
    if (u.hostname === "kevinhoang.co") {
      u.hostname = "www.kevinhoang.co";
      return u.href;
    }
  } catch {
    return t;
  }
  return t;
}

const DEFAULT_SIGNIN_IMAGE_URL =
  "https://www.kevinhoang.co/images/kevin_hoang_phone_icon.png";

/** Signature row icons — same host and `/images/` path as `DEFAULT_SIGNIN_IMAGE_URL`. */
const DEFAULT_SIGNIN_ICON_PHONE_URL =
  "https://www.kevinhoang.co/images/phone.png";
const DEFAULT_SIGNIN_ICON_MAIL_URL =
  "https://www.kevinhoang.co/images/mail.png";
const DEFAULT_SIGNIN_ICON_MAP_PIN_URL =
  "https://www.kevinhoang.co/images/map-pin.png";
const DEFAULT_SIGNIN_ICON_CALENDAR_URL =
  "https://www.kevinhoang.co/images/calendar.png";

/** Default Google Calendar appointment scheduling (overridable via SIGNIN_GOOGLE_CALENDAR_URL). */
const DEFAULT_GOOGLE_CALENDAR_BOOKING_URL =
  "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0jsQsyVOflGXlyOcXCCpg-Fmn3By1TnSMXS0hj7rNlJtGrQqRSgc8OqUdCiKY9GmEADZzHr6nZ";

/** Gray circular badge + hosted PNG (email-client friendly vs inline SVG). */
function contactIconBadgePng(imageUrl: string, alt: string): string {
  const safeUrl = escapeHtml(imageUrl);
  const safeAlt = escapeHtml(alt);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" style="width:44px;height:44px;background-color:#f3f4f6;border-radius:22px;line-height:0;mso-line-height-rule:exactly;"><img src="${safeUrl}" width="20" height="20" alt="${safeAlt}" style="display:block;width:20px;height:20px;margin:0 auto;" /></td></tr></table>`;
}

function buildSignInConfirmationEmailHtml(opts: {
  firstNameDisplay: string;
  townPhrase: string;
  welcomeTitle: string;
  imageUrl: string;
  phoneDisplay: string;
  phoneTel: string;
  websiteUrl: string;
  websiteLabel: string;
  emailAddress: string;
  agentName: string;
  advisorTitle: string;
  ctaUrl: string;
}): string {
  const {
    firstNameDisplay,
    townPhrase,
    welcomeTitle,
    imageUrl,
    phoneDisplay,
    phoneTel,
    websiteUrl,
    websiteLabel,
    emailAddress,
    agentName,
    advisorTitle,
    ctaUrl,
  } = opts;

  const safeWelcome = escapeHtml(welcomeTitle);
  const safeFirst = escapeHtml(firstNameDisplay);
  const safeTownPhrase = escapeHtml(townPhrase);

  const safeImageUrl = escapeHtml(imageUrl);
  const safePhoneDisplay = escapeHtml(phoneDisplay);
  const safePhoneTel = escapeHtml(phoneTel);
  const safeWebsiteUrl = escapeHtml(websiteUrl);
  const safeEmail = escapeHtml(emailAddress);
  const nameUpper = escapeHtml(agentName.trim().toUpperCase());
  const safeAdvisorTitle = escapeHtml(advisorTitle.trim().toUpperCase());
  const safeCtaUrl = escapeHtml(ctaUrl);
  const websiteUpper = escapeHtml(websiteLabel.trim().toUpperCase());
  const emailUpper = escapeHtml(emailAddress.trim().toUpperCase());
  const badgePhone = contactIconBadgePng(DEFAULT_SIGNIN_ICON_PHONE_URL, "Phone");
  const badgeMapPin = contactIconBadgePng(DEFAULT_SIGNIN_ICON_MAP_PIN_URL, "Website");
  const badgeMail = contactIconBadgePng(DEFAULT_SIGNIN_ICON_MAIL_URL, "Email");
  const badgeCalendar = contactIconBadgePng(DEFAULT_SIGNIN_ICON_CALENDAR_URL, "Calendar");
  const blogUrl = escapeHtml(
    `${websiteUrl.replace(/\/$/, "").trim()}/blog`,
  );

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Sign-in confirmation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet" />
  <style type="text/css">
    .email-sig-fade.email-sig-fade-on {
      opacity: 1;
    }
    @keyframes emailSigFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes goldLineReveal {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
    @media only screen {
      .email-sig-fade.email-sig-fade-on {
        opacity: 0;
        animation: emailSigFadeIn 1.5s ease forwards;
      }
      .gold-line-reveal {
        display: block;
        width: 100%;
        max-width: 380px;
        height: 1px;
        background-color: #C5A059;
        transform: scaleX(0);
        transform-origin: center center;
        -webkit-transform-origin: center center;
        animation: goldLineReveal 1s ease 0.35s forwards;
      }
      .sig-link {
        color: #222222 !important;
        text-decoration: none !important;
        border-bottom: 1px solid transparent;
        transition: color 0.2s ease, transform 0.2s ease;
        display: inline-block;
      }
      .sig-link:hover {
        color: #C5A059 !important;
        transform: translateY(-2px);
      }
      .sig-cta {
        color: #222222 !important;
        text-decoration: none !important;
        border-bottom: none !important;
        transition: color 0.2s ease, transform 0.2s ease;
        display: inline-block;
      }
      .sig-cta:hover {
        color: #C5A059 !important;
        transform: translateY(-2px);
      }
    }
    /* Larger type on small screens — easier to read on phone than desktop defaults */
    @media only screen and (max-width: 480px) {
      .email-welcome {
        font-size: 26px !important;
        line-height: 1.3 !important;
      }
      .email-paragraph {
        font-size: 17px !important;
        line-height: 1.65 !important;
      }
      .email-pocket {
        font-size: 16px !important;
        line-height: 1.65 !important;
      }
      .email-more-site {
        font-size: 16px !important;
        line-height: 1.65 !important;
      }
      .email-sig-photo {
        width: 160px !important;
        height: 160px !important;
        max-width: 78vw !important;
      }
      .email-sig-name {
        font-size: 19px !important;
        letter-spacing: 0.12em !important;
      }
      .email-sig-title {
        font-size: 13px !important;
      }
      .email-sig-contact {
        font-size: 15px !important;
      }
    }
    /* Footer: photo left + text right on wider screens; stack on phone */
    @media only screen and (max-width: 480px) {
      .sig-col-photo {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        padding-right: 0 !important;
        padding-bottom: 22px !important;
        text-align: center !important;
      }
      .sig-col-text {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
      }
      .sig-inner-left {
        text-align: center !important;
      }
      .sig-inner-left table {
        margin-left: auto !important;
        margin-right: auto !important;
      }
    }
  </style>
  <!--[if mso]><style type="text/css">table {border-collapse:collapse;border-spacing:0;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:Inter,Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border:1px solid #2d2d2d;background-color:#ffffff;">
          <tr>
            <td style="padding:40px;font-family:Inter,Arial,Helvetica,sans-serif;color:#1a1a1a;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="email-welcome" style="padding:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:#1a1a1a;text-align:center;font-weight:500;">
                    Welcome to ${safeWelcome}
                  </td>
                </tr>
                <tr>
                  <td class="email-paragraph" style="padding:0 0 20px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
                    Hi ${safeFirst},<br /><br />
                    Thank you for joining us today.
                  </td>
                </tr>
                <tr>
                  <td class="email-paragraph" style="padding:0 0 24px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
                    <strong style="font-weight:600;">Navigating the Market:</strong> Finding the right home in ${safeTownPhrase} is often about understanding the subtle differences between streets and recent comparable sales that don't always tell the whole story.
                  </td>
                </tr>
                <tr>
                  <td class="email-paragraph" style="padding:0 0 24px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
                    I can put together a Neighborhood Analysis that highlights local trends and upcoming community developments. If this home isn't the perfect fit, I can create a custom search for you that filters out the noise and focuses only on high-yield opportunities.
                  </td>
                </tr>
                <tr>
                  <td class="email-paragraph" style="padding:0 0 28px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
                    Enjoy your tour. I'll be nearby if you have any questions.
                  </td>
                </tr>
                <tr>
                  <td class="email-pocket" style="padding:16px 20px;margin:0;border-left:3px solid #c9a962;background-color:#fafafa;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#444444;font-style:italic;">
                    Looking for something more specific? Ask me about our private luxury residences available exclusively through our network.
                  </td>
                </tr>
                <tr>
                  <td class="email-more-site" style="padding:24px 0 0 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
                    You can find more about the real estate process, market updates, and stories from the field on my <a href="${safeWebsiteUrl}" style="color:#1a1a1a;text-decoration:underline;">website</a>, including articles on the <a href="${blogUrl}" style="color:#1a1a1a;text-decoration:underline;">blog</a>.
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 0 0 0;">
                    <table role="presentation" class="email-sig-fade email-sig-fade-on" width="100%" cellpadding="0" cellspacing="0" border="0" style="opacity:1;border-top:1px solid #eeeeee;padding-top:24px;">
                      <tr>
                        <td style="padding:0;">
                          <table role="presentation" class="sig-footer-table" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td class="sig-col-photo" valign="middle" width="200" style="width:200px;max-width:200px;padding:0 24px 0 0;vertical-align:middle;text-align:center;">
                                <img class="email-sig-photo" src="${safeImageUrl}" width="176" height="176" alt="" style="display:block;width:176px;height:176px;max-width:100%;border-radius:50%;object-fit:cover;border:1px solid #C5A059;margin:0 auto;" />
                              </td>
                              <td class="sig-col-text sig-inner-left" valign="middle" style="vertical-align:middle;padding:0;text-align:left;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="left">
                                  <tr>
                                    <td class="email-sig-name" style="padding:0 0 10px 0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:22px;line-height:1.25;color:#222222;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;text-align:left;text-shadow:0.2px 0 #222222, -0.2px 0 #222222;">
                                      ${nameUpper}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="left" style="padding:0 0 12px 0;">
                                      <table width="380" cellpadding="0" cellspacing="0" border="0" align="left" style="max-width:380px;width:100%;">
                                        <tr>
                                          <td bgcolor="#C5A059" height="1" style="font-size:1px;line-height:1px;mso-line-height-rule:exactly;">
                                            <div class="gold-line-reveal" style="height:1px;line-height:1px;background-color:#C5A059;font-size:1px;"></div>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="email-sig-title" style="padding:0 0 16px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.85;color:#222222;font-weight:400;letter-spacing:0.12em;text-transform:uppercase;text-align:left;">
                                      ${safeAdvisorTitle}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="email-sig-contact" style="padding:0 0 10px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.85;color:#222222;">
                                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left">
                                        <tr>
                                          <td valign="middle" style="padding:0 16px 0 0;vertical-align:middle;line-height:0;">${badgePhone}</td>
                                          <td valign="middle" style="vertical-align:middle;">
                                            <a href="tel:${safePhoneTel}" class="sig-link" style="color:#222222;text-decoration:none;border-bottom:1px solid transparent;letter-spacing:0.12em;">${safePhoneDisplay}</a>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="email-sig-contact" style="padding:0 0 10px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.85;color:#222222;">
                                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left">
                                        <tr>
                                          <td valign="middle" style="padding:0 16px 0 0;vertical-align:middle;line-height:0;">${badgeMapPin}</td>
                                          <td valign="middle" style="vertical-align:middle;">
                                            <a href="${safeWebsiteUrl}" class="sig-link" style="color:#222222;text-decoration:none;border-bottom:1px solid transparent;letter-spacing:0.12em;">${websiteUpper}</a>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="email-sig-contact" style="padding:0 0 14px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.85;color:#222222;">
                                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left">
                                        <tr>
                                          <td valign="middle" style="padding:0 16px 0 0;vertical-align:middle;line-height:0;">${badgeMail}</td>
                                          <td valign="middle" style="vertical-align:middle;">
                                            <a href="mailto:${safeEmail}" class="sig-link" style="color:#222222;text-decoration:none;border-bottom:1px solid transparent;letter-spacing:0.12em;">${emailUpper}</a>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="email-sig-contact" style="padding:0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.85;color:#222222;">
                                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left">
                                        <tr>
                                          <td valign="middle" style="padding:0 16px 0 0;vertical-align:middle;line-height:0;">${badgeCalendar}</td>
                                          <td valign="middle" style="vertical-align:middle;">
                                            <a href="${safeCtaUrl}" class="sig-cta" style="color:#222222;text-decoration:none;border-bottom:none;letter-spacing:0.12em;">SET AN APPOINTMENT</a>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('Received request:', req.method);
    const body = await req.json();
    const {
      type,
      eventName,
      address,
      firstName,
      lastName,
      email,
      phone,
      worksWithRealtor,
      realtorName,
      realtorCompany,
      town: townRaw,
      welcomeAddress: welcomeAddressRaw,
    } = body;
    // Event: explicit type or eventName present without address
    const isEvent = Boolean((type === 'event' && eventName) || (eventName && !address));
    const locationLabel = isEvent ? (eventName || '').trim() : (address || '').trim();
    console.log('Parsed request data:', { type, isEvent, eventName, address, firstName, lastName, email, phone, worksWithRealtor, realtorName, realtorCompany });

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
    if (!locationLabel || !firstName || !lastName || (!normalizedEmail && !normalizedPhone)) {
      console.log('Missing required fields:', { locationLabel, firstName, lastName, email: normalizedEmail, phone: normalizedPhone });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: {
            [isEvent ? 'eventName' : 'address']: !locationLabel ? (isEvent ? 'Missing event name' : 'Missing address') : null,
            firstName: !firstName ? 'Missing first name' : null,
            lastName: !lastName ? 'Missing last name' : null,
            contact: (!normalizedEmail && !normalizedPhone) ? 'Missing email or phone' : null
          }
        }),
        {
          headers: corsHeaders,
          status: 400
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      console.error('SUPABASE_URL exists:', !!supabaseUrl);
      console.error('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing Supabase environment variables'
        }),
        {
          headers: corsHeaders,
          status: 500
        }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    // The service role key should bypass all RLS policies automatically
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
    console.log('Initialized Supabase client with service role key');
    console.log('Service role key length:', supabaseServiceKey.length);
    console.log('Supabase URL:', supabaseUrl);

    // Format phone number if provided
    let formattedPhone = normalizedPhone;
    if (formattedPhone) {
      // Remove any non-digit characters
      const numbers = formattedPhone.replace(/\D/g, "");
      // Format as XXX-XXX-XXXX
      if (numbers.length === 10) {
        formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      }
    }

    // Check if first name exists
    let { data: firstNameData, error: firstNameError } = await supabase
      .from('contact_first_names')
      .select('id')
      .eq('first_name', firstName.trim())
      .single();

    // If first name doesn't exist, insert it
    if (!firstNameData) {
      const { data: newFirstNameData, error: newFirstNameError } = await supabase
        .from('contact_first_names')
        .insert({ first_name: firstName.trim() })
        .select()
        .single();

      if (newFirstNameError) {
        console.error('Error inserting first name:', newFirstNameError);
        throw newFirstNameError;
      }
      firstNameData = newFirstNameData;
    }

    // Check if last name exists
    let { data: lastNameData, error: lastNameError } = await supabase
      .from('contact_last_names')
      .select('id')
      .eq('last_name', lastName.trim())
      .single();

    // If last name doesn't exist, insert it
    if (!lastNameData) {
      const { data: newLastNameData, error: newLastNameError } = await supabase
        .from('contact_last_names')
        .insert({ last_name: lastName.trim() })
        .select()
        .single();

      if (newLastNameError) {
        console.error('Error inserting last name:', newLastNameError);
        throw newLastNameError;
      }
      lastNameData = newLastNameData;
    }

    // Check if email exists (if provided)
    let emailData = null;
    if (normalizedEmail) {
      const { data: existingEmailData, error: emailError } = await supabase
        .from('contact_emails')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      // If email doesn't exist, insert it
      if (!existingEmailData) {
        const { data: newEmailData, error: newEmailError } = await supabase
          .from('contact_emails')
          .insert({ email: normalizedEmail })
          .select()
          .single();

        if (newEmailError) {
          console.error('Error inserting email:', newEmailError);
          throw newEmailError;
        }
        emailData = newEmailData;
      } else {
        emailData = existingEmailData;
      }
    }

    // Check if phone exists (if provided)
    let phoneData = null;
    if (formattedPhone) {
      const { data: existingPhoneData, error: phoneError } = await supabase
        .from('contact_phones')
        .select('id')
        .eq('phone', formattedPhone)
        .single();

      // If phone doesn't exist, insert it
      if (!existingPhoneData) {
        const { data: newPhoneData, error: newPhoneError } = await supabase
          .from('contact_phones')
          .insert({ phone: formattedPhone })
          .select()
          .single();

        if (newPhoneError) {
          console.error('Error inserting phone:', newPhoneError);
          throw newPhoneError;
        }
        phoneData = newPhoneData;
      } else {
        phoneData = existingPhoneData;
      }
    }

    // Check if source exists: "Event & [Name]" or "Open House & [Address]"
    const contactSource = isEvent ? `Event & ${eventName.trim()}` : `Open House & ${address.trim()}`;
    let { data: sourceData, error: sourceError } = await supabase
      .from('contact_sources')
      .select('id')
      .eq('source', contactSource)
      .single();

    // If source doesn't exist, insert it
    if (!sourceData) {
      const { data: newSourceData, error: newSourceError } = await supabase
        .from('contact_sources')
        .insert({ source: contactSource })
        .select()
        .single();

      if (newSourceError) {
        console.error('Error inserting source:', newSourceError);
        throw newSourceError;
      }
      sourceData = newSourceData;
    }

    // Insert sign-in: event_sign_ins for events, open_house_sign_ins for open house
    if (isEvent) {
      const { error: insertError } = await supabase
        .from('event_sign_ins')
        .insert({
          event_name: eventName.trim(),
          first_name_id: firstNameData.id,
          last_name_id: lastNameData.id,
          email_id: emailData?.id || null,
          phone_id: phoneData?.id || null,
          source_id: sourceData.id,
        });
      if (insertError) {
        console.error('Error inserting event sign-in:', insertError);
        throw insertError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('open_house_sign_ins')
        .insert({
          address: address.trim(),
          first_name_id: firstNameData.id,
          last_name_id: lastNameData.id,
          email_id: emailData?.id || null,
          phone_id: phoneData?.id || null,
          source_id: sourceData.id,
          works_with_realtor: worksWithRealtor || false,
          realtor_name: worksWithRealtor && realtorName ? realtorName.trim() : null,
          realtor_company: worksWithRealtor && realtorCompany ? realtorCompany.trim() : null,
        });
      if (insertError) {
        console.error('Error inserting open house sign-in:', insertError);
        throw insertError;
      }
    }

    // Also create/update contact in contacts table
    // Check if contact already exists (handle NULL phone_id properly)
    console.log('Checking for existing contact with email_id:', emailData?.id || null, 'phone_id:', phoneData?.id || null);
    
    // Track contact creation status
    let contactCreated = false;
    let contactErrorDetails: any = null;
    let newContact: any = null;
    
    // First, try to find by email_id and phone_id (if phone exists)
    let existingContact = null;
    let checkError = null;
    
    if (emailData?.id && phoneData?.id) {
      // Check with both email and phone
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('email_id', emailData.id)
        .eq('phone_id', phoneData.id)
        .maybeSingle();
      existingContact = data;
      checkError = error;

      // If not found, check email-only and phone-only contact variants
      if (!existingContact && !checkError) {
        const { data: emailOnlyData, error: emailOnlyError } = await supabase
          .from('contacts')
          .select('id')
          .eq('email_id', emailData.id)
          .is('phone_id', null)
          .maybeSingle();
        if (emailOnlyData) {
          existingContact = emailOnlyData;
        }
        if (emailOnlyError && !checkError) {
          checkError = emailOnlyError;
        }
      }
      if (!existingContact && !checkError) {
        const { data: phoneOnlyData, error: phoneOnlyError } = await supabase
          .from('contacts')
          .select('id')
          .is('email_id', null)
          .eq('phone_id', phoneData.id)
          .maybeSingle();
        if (phoneOnlyData) {
          existingContact = phoneOnlyData;
        }
        if (phoneOnlyError && !checkError) {
          checkError = phoneOnlyError;
        }
      }
    } else if (emailData?.id) {
      // Check by email only
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('email_id', emailData.id)
        .maybeSingle();
      existingContact = data;
      checkError = error;
    } else if (phoneData?.id) {
      // Check by phone only
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone_id', phoneData.id)
        .maybeSingle();
      existingContact = data;
      checkError = error;
    }
    
    if (checkError) {
      console.error('Error checking for existing contact:', checkError);
    }

    if (existingContact) {
      console.log('Found existing contact with id:', existingContact.id);
      // Update existing contact's source if needed (keep most recent)
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
          source_id: sourceData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id);
      
      if (updateError) {
        console.error('Error updating existing contact:', updateError);
        contactErrorDetails = updateError;
      } else {
        console.log('Successfully updated existing contact');
        contactCreated = true;
      }
    } else {
      console.log('No existing contact found, creating new contact');
      // Create new contact
      const contactData = {
        first_name_id: firstNameData.id,
        last_name_id: lastNameData.id,
        email_id: emailData?.id || null,
        phone_id: phoneData?.id || null,
        source_id: sourceData.id,
        is_active: true,
      };
      console.log('Inserting contact with data:', contactData);
      
      // Try to insert the contact - use service role to bypass RLS
      console.log('Attempting to insert contact with service role...');
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select('id')
        .single();

      if (contactError) {
        console.error('❌ ERROR inserting contact:', contactError);
        console.error('Contact insert details:', contactData);
        console.error('Full error object:', JSON.stringify(contactError, null, 2));
        console.error('Error code:', contactError.code);
        console.error('Error message:', contactError.message);
        console.error('Error details:', contactError.details);
        console.error('Error hint:', contactError.hint);
        contactErrorDetails = contactError;
        
        // Try alternative approach - check if it's an RLS issue
        console.log('Attempting to verify service role key is being used...');
        const { data: testQuery, error: testError } = await supabase
          .from('contacts')
          .select('id')
          .limit(1);
        if (testError) {
          console.error('❌ Cannot query contacts table - RLS or permission issue:', testError);
        } else {
          console.log('✅ Can query contacts table, service role is working');
        }
        
        // Don't return - continue with email sending even if contact creation failed
        // The open house sign-in was successful, so we should still send the email
      } else {
        console.log('✅ Successfully created new contact with id:', newContact?.id);
        contactCreated = true;
        // Verify the contact was actually created
        const { data: verifyContact, error: verifyError } = await supabase
          .from('contacts')
          .select('id, is_active, email_id, phone_id')
          .eq('id', newContact.id)
          .single();
        if (verifyError) {
          console.error('❌ Error verifying contact creation:', verifyError);
        } else {
          console.log('✅ Verified contact exists in database:', verifyContact);
        }
      }
    }

    console.log('Database updated successfully');

    // Send email notification
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('RESEND_API_KEY exists:', !!resendApiKey);
    console.log('RESEND_API_KEY length:', resendApiKey?.length);

    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY environment variable');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing RESEND_API_KEY environment variable'
        }),
        {
          headers: corsHeaders,
          status: 500
        }
      );
    }

    const resend = new Resend(resendApiKey);
    console.log('Initialized Resend client');

    try {
      console.log('Attempting to send email...');
      const subject = isEvent ? `Event Sign-In - ${eventName}` : `Open House Sign-In - ${address}`;
      const headerTitle = isEvent ? 'Event Sign-In' : 'Open House Sign-In';
      const locationLabelField = isEvent
        ? `<div class="field"><span class="label">Event</span><div class="value">${eventName}</div></div>`
        : `<div class="field"><span class="label">Property Address</span><div class="value">${address}</div></div>`;
      const realtorSection = isEvent ? '' : `
                  <div class="field">
                    <span class="label">Has Agent</span>
                    <div class="value">${worksWithRealtor ? 'Yes' : 'No'}</div>
                  </div>
                  ${worksWithRealtor ? `
                  <div class="field">
                    <span class="label">Agent Name</span>
                    <div class="value">${realtorName || 'Not provided'}</div>
                  </div>
                  <div class="field">
                    <span class="label">Agent Company</span>
                    <div class="value">${realtorCompany || 'Not provided'}</div>
                  </div>
                  ` : ''}
                  `;
      const data = await resend.emails.send({
        from: "Kevin Hoang <contact@kevinhoang.co>",
        to: [Deno.env.get("SIGNIN_NOTIFICATION_EMAIL") ?? "knhoangre@gmail.com"],
        subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #1a1a1a;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 0;
                  background-color: #f5f5f5;
                }
                .container {
                  background-color: #ffffff;
                  border-radius: 12px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                  margin: 20px;
                  overflow: hidden;
                }
                .header {
                  background-color: #1a1a1a;
                  color: white;
                  padding: 24px;
                  text-align: center;
                }
                .header h2 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
                  letter-spacing: -0.5px;
                }
                .content {
                  padding: 32px;
                }
                .field {
                  margin-bottom: 24px;
                }
                .field:last-child {
                  margin-bottom: 0;
                }
                .label {
                  font-weight: 600;
                  color: #666;
                  font-size: 14px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 8px;
                  display: block;
                }
                .value {
                  color: #1a1a1a;
                  font-size: 16px;
                  line-height: 1.5;
                }
                .action-button {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #1a1a1a;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 500;
                  transition: background-color 0.2s ease;
                }
                .action-button:hover {
                  background-color: #333;
                }
                @media (max-width: 600px) {
                  .container {
                    margin: 10px;
                  }
                  .content {
                    padding: 24px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>${headerTitle}</h2>
                </div>
                <div class="content">
                  ${locationLabelField}
                  <div class="field">
                    <span class="label">First Name</span>
                    <div class="value">${firstName}</div>
                  </div>
                  <div class="field">
                    <span class="label">Last Name</span>
                    <div class="value">${lastName}</div>
                  </div>
                  <div class="field">
                    <span class="label">Email</span>
                    <div class="value">${normalizedEmail || 'Not provided'}</div>
                  </div>
                  <div class="field">
                    <span class="label">Phone Number</span>
                    <div class="value">
                      ${formattedPhone ? `
                        <div style="display: flex; gap: 12px;">
                          <a href="tel:+1${formattedPhone.replace(/\D/g, '')}" class="action-button" style="flex: 1; text-align: center;">
                            <span style="display: block; margin-bottom: 4px;">📞</span>
                            Call
                          </a>
                          <a href="sms:+1${formattedPhone.replace(/\D/g, '')}" class="action-button" style="flex: 1; text-align: center; background-color: #4CAF50;">
                            <span style="display: block; margin-bottom: 4px;">💬</span>
                            Text
                          </a>
                        </div>
                        <div style="margin-top: 8px; text-align: center; color: #666; font-size: 14px;">
                          ${formattedPhone}
                        </div>
                      ` : 'Not provided'}
                    </div>
                  </div>
                  ${realtorSection}
                </div>
              </div>
            </body>
          </html>
        `
      });
      console.log('Email sent successfully:', data);

      let confirmationSent = false;
      let confirmationError: string | null = null;
      try {
        const townTrimmed = typeof townRaw === "string" ? townRaw.trim() : "";
        const welcomeTrimmed = typeof welcomeAddressRaw === "string"
          ? welcomeAddressRaw.trim()
          : "";
        const welcomeTitle = isEvent
          ? (eventName || "").trim() || locationLabel
          : welcomeTrimmed || (address || "").trim() || locationLabel;
        const townPhrase = townTrimmed || "this community";

        const imageUrl = canonicalWwwKevinhoangUrl(
          (Deno.env.get("SIGNIN_EMAIL_IMAGE_URL") || "").trim() ||
            DEFAULT_SIGNIN_IMAGE_URL,
        );
        const phoneDisplay = (Deno.env.get("SIGNIN_CONTACT_PHONE") || "").trim() ||
          "860-682-2251";
        const phoneDigits = phoneDisplay.replace(/\D/g, "");
        const phoneTel = phoneDigits.length === 10
          ? `+1${phoneDigits}`
          : phoneDigits
          ? `+${phoneDigits}`
          : "+18606822251";
        const websiteUrl = canonicalWwwKevinhoangUrl(
          (Deno.env.get("SIGNIN_CONTACT_WEBSITE") || "").trim() ||
            "https://www.kevinhoang.co",
        );
        const websiteLabel = (Deno.env.get("SIGNIN_CONTACT_WEBSITE_LABEL") || "").trim() ||
          "kevinhoang.co";
        const contactEmail = (Deno.env.get("SIGNIN_CONTACT_EMAIL") || "").trim() ||
          "knhoangre@gmail.com";
        const agentName = (Deno.env.get("SIGNIN_AGENT_NAME") || "").trim() ||
          "Kevin Hoang";
        const advisorTitle = (Deno.env.get("SIGNIN_ADVISOR_TITLE") || "").trim() ||
          "LUXURY REALTOR";
        const ctaUrl =
          (Deno.env.get("SIGNIN_GOOGLE_CALENDAR_URL") || "").trim() ||
          (Deno.env.get("SIGNIN_CTA_URL") || "").trim() ||
          DEFAULT_GOOGLE_CALENDAR_BOOKING_URL;

        const confirmationHtml = buildSignInConfirmationEmailHtml({
          firstNameDisplay: capitalizeFirstName(String(firstName || "")),
          townPhrase,
          welcomeTitle,
          imageUrl,
          phoneDisplay,
          phoneTel,
          websiteUrl,
          websiteLabel,
          emailAddress: contactEmail,
          agentName,
          advisorTitle,
          ctaUrl,
        });

        const confirmSubject = `Your sign-in — Welcome${welcomeTitle ? ` to ${welcomeTitle}` : ""}`;
        const guestEmail = normalizedEmail;
        const ccEmail = (Deno.env.get("SIGNIN_AGENT_EMAIL") ??
          Deno.env.get("SIGNIN_NOTIFICATION_EMAIL") ?? "knhoangre@gmail.com")
          .trim()
          .toLowerCase();

        if (guestEmail) {
          const confirmationPayload: {
            from: string;
            to: string[];
            cc?: string[];
            subject: string;
            html: string;
          } = {
            from: "Kevin Hoang <contact@kevinhoang.co>",
            to: [guestEmail],
            subject: confirmSubject,
            html: confirmationHtml,
          };
          if (ccEmail && ccEmail !== guestEmail) {
            confirmationPayload.cc = [ccEmail];
          }

          await resend.emails.send(confirmationPayload);
          confirmationSent = true;
          console.log(
            "Sign-in confirmation email sent (TO guest, CC agent when different)",
          );
        } else {
          console.log("No guest email provided; skipping confirmation email send.");
        }
      } catch (confirmErr) {
        console.error("Confirmation email error:", confirmErr);
        confirmationError = confirmErr instanceof Error
          ? confirmErr.message
          : String(confirmErr);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data,
          confirmationSent,
          confirmationError,
          contactCreated,
          contactError: contactErrorDetails ? {
            code: contactErrorDetails.code,
            message: contactErrorDetails.message,
            details: contactErrorDetails.details,
            hint: contactErrorDetails.hint
          } : null
        }),
        {
          headers: corsHeaders,
          status: 200
        }
      );
    } catch (error: unknown) {
      console.error('Resend API error:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: err.message,
          resendError: String(error),
        }),
        {
          headers: corsHeaders,
          status: 500
        }
      );
    }
  } catch (error: unknown) {
    console.error('General error:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: err.message,
      }),
      {
        headers: corsHeaders,
        status: 500
      }
    );
  }
});

