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
    const { address, firstName, lastName, email, phone, worksWithRealtor, realtorName, realtorCompany } = await req.json();
    console.log('Parsed request data:', { address, firstName, lastName, email, phone, worksWithRealtor, realtorName, realtorCompany });

    if (!address || !firstName || !lastName || !email) {
      console.log('Missing required fields:', { address, firstName, lastName, email });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: {
            address: !address ? 'Missing address' : null,
            firstName: !firstName ? 'Missing first name' : null,
            lastName: !lastName ? 'Missing last name' : null,
            email: !email ? 'Missing email' : null
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Initialized Supabase client');

    // Format phone number if provided
    let formattedPhone = phone;
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

    // Check if email exists
    let { data: emailData, error: emailError } = await supabase
      .from('contact_emails')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    // If email doesn't exist, insert it
    if (!emailData) {
      const { data: newEmailData, error: newEmailError } = await supabase
        .from('contact_emails')
        .insert({ email: email.trim().toLowerCase() })
        .select()
        .single();

      if (newEmailError) {
        console.error('Error inserting email:', newEmailError);
        throw newEmailError;
      }
      emailData = newEmailData;
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

    // Check if source exists (use "open_house" as the source)
    const contactSource = "open_house";
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

    // Insert the open house sign-in with the IDs
    const { error: insertError } = await supabase
      .from('open_house_sign_ins')
      .insert({
        address: address.trim(),
        first_name_id: firstNameData.id,
        last_name_id: lastNameData.id,
        email_id: emailData.id,
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
      const data = await resend.emails.send({
        from: "Kevin Hoang <contact@kevinhoang.dev>",
        to: ["knhoangre@gmail.com"],
        subject: `Open House Sign-In - ${address}`,
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
                  <h2>Open House Sign-In</h2>
                </div>
                <div class="content">
                  <div class="field">
                    <span class="label">Property Address</span>
                    <div class="value">${address}</div>
                  </div>
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
                    <div class="value">${email}</div>
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
                </div>
              </div>
            </body>
          </html>
        `
      });
      console.log('Email sent successfully:', data);

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: corsHeaders,
          status: 200
        }
      );
    } catch (error) {
      console.error('Resend API error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: error instanceof Error ? error.message : 'Unknown error',
          resendError: error
        }),
        {
          headers: corsHeaders,
          status: 500
        }
      );
    }
  } catch (error) {
    console.error('General error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: corsHeaders,
        status: 500
      }
    );
  }
});

