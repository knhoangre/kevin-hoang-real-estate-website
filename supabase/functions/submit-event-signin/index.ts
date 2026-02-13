import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@3.1.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    const { eventName, firstName, lastName, email, phone } = await req.json();
    console.log('Parsed request data:', { eventName, firstName, lastName, email, phone });

    if (!eventName || !firstName || !lastName || !email) {
      console.log('Missing required fields:', { eventName, firstName, lastName, email });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: {
            eventName: !eventName ? 'Missing event name' : null,
            firstName: !firstName ? 'Missing first name' : null,
            lastName: !lastName ? 'Missing last name' : null,
            email: !email ? 'Missing email' : null
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing Supabase environment variables'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' }
    });

    let formattedPhone = phone;
    if (formattedPhone) {
      const numbers = formattedPhone.replace(/\D/g, "");
      if (numbers.length === 10) {
        formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      }
    }

    // First name
    let { data: firstNameData } = await supabase
      .from('contact_first_names')
      .select('id')
      .eq('first_name', firstName.trim())
      .single();
    if (!firstNameData) {
      const { data: newData, error: e } = await supabase
        .from('contact_first_names')
        .insert({ first_name: firstName.trim() })
        .select()
        .single();
      if (e) throw e;
      firstNameData = newData;
    }

    // Last name
    let { data: lastNameData } = await supabase
      .from('contact_last_names')
      .select('id')
      .eq('last_name', lastName.trim())
      .single();
    if (!lastNameData) {
      const { data: newData, error: e } = await supabase
        .from('contact_last_names')
        .insert({ last_name: lastName.trim() })
        .select()
        .single();
      if (e) throw e;
      lastNameData = newData;
    }

    // Email
    let { data: emailData } = await supabase
      .from('contact_emails')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();
    if (!emailData) {
      const { data: newData, error: e } = await supabase
        .from('contact_emails')
        .insert({ email: email.trim().toLowerCase() })
        .select()
        .single();
      if (e) throw e;
      emailData = newData;
    }

    // Phone (optional)
    let phoneData = null;
    if (formattedPhone) {
      const { data: existing } = await supabase
        .from('contact_phones')
        .select('id')
        .eq('phone', formattedPhone)
        .single();
      if (existing) {
        phoneData = existing;
      } else {
        const { data: newData, error: e } = await supabase
          .from('contact_phones')
          .insert({ phone: formattedPhone })
          .select()
          .single();
        if (e) throw e;
        phoneData = newData;
      }
    }

    const contactSource = `Event & ${eventName.trim()}`;
    let { data: sourceData } = await supabase
      .from('contact_sources')
      .select('id')
      .eq('source', contactSource)
      .single();
    if (!sourceData) {
      const { data: newData, error: e } = await supabase
        .from('contact_sources')
        .insert({ source: contactSource })
        .select()
        .single();
      if (e) throw e;
      sourceData = newData;
    }

    const { error: insertError } = await supabase
      .from('event_sign_ins')
      .insert({
        event_name: eventName.trim(),
        first_name_id: firstNameData.id,
        last_name_id: lastNameData.id,
        email_id: emailData.id,
        phone_id: phoneData?.id ?? null,
        source_id: sourceData.id,
      });

    if (insertError) {
      console.error('Error inserting event sign-in:', insertError);
      throw insertError;
    }

    // Create/update contact
    let existingContact = null;
    if (phoneData?.id) {
      const { data } = await supabase
        .from('contacts')
        .select('id')
        .eq('email_id', emailData.id)
        .eq('phone_id', phoneData.id)
        .maybeSingle();
      existingContact = data;
      if (!existingContact) {
        const { data: emailOnly } = await supabase
          .from('contacts')
          .select('id')
          .eq('email_id', emailData.id)
          .is('phone_id', null)
          .maybeSingle();
        existingContact = emailOnly;
      }
    } else {
      const { data } = await supabase
        .from('contacts')
        .select('id')
        .eq('email_id', emailData.id)
        .is('phone_id', null)
        .maybeSingle();
      existingContact = data;
    }

    if (existingContact) {
      await supabase
        .from('contacts')
        .update({ source_id: sourceData.id, updated_at: new Date().toISOString() })
        .eq('id', existingContact.id);
    } else {
      await supabase
        .from('contacts')
        .insert({
          first_name_id: firstNameData.id,
          last_name_id: lastNameData.id,
          email_id: emailData.id,
          phone_id: phoneData?.id ?? null,
          source_id: sourceData.id,
          is_active: true,
        });
    }

    // Send email notification
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      try {
        await resend.emails.send({
          from: "Kevin Hoang <contact@kevinhoang.co>",
          to: ["knhoangre@gmail.com"],
          subject: `Event Sign-In - ${eventName}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #1a1a1a; color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h2 style="margin: 0; font-size: 24px;">Event Sign-In</h2>
                </div>
                <div style="background: #fff; padding: 32px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
                  <p><strong>Event</strong><br/>${eventName}</p>
                  <p><strong>First Name</strong><br/>${firstName}</p>
                  <p><strong>Last Name</strong><br/>${lastName}</p>
                  <p><strong>Email</strong><br/>${email}</p>
                  <p><strong>Phone</strong><br/>${formattedPhone || 'Not provided'}</p>
                </div>
              </body>
            </html>
          `
        });
      } catch (emailErr) {
        console.error('Resend error:', emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
