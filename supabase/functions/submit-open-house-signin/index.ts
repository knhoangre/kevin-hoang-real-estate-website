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
    const body = await req.json();
    const { type, eventName, address, firstName, lastName, email, phone, worksWithRealtor, realtorName, realtorCompany } = body;
    // Event: explicit type or eventName present without address
    const isEvent = Boolean((type === 'event' && eventName) || (eventName && !address));
    const locationLabel = isEvent ? (eventName || '').trim() : (address || '').trim();
    console.log('Parsed request data:', { type, isEvent, eventName, address, firstName, lastName, email, phone, worksWithRealtor, realtorName, realtorCompany });

    if (!locationLabel || !firstName || !lastName || !email) {
      console.log('Missing required fields:', { locationLabel, firstName, lastName, email });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: {
            [isEvent ? 'eventName' : 'address']: !locationLabel ? (isEvent ? 'Missing event name' : 'Missing address') : null,
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
          email_id: emailData.id,
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
    }

    // Also create/update contact in contacts table
    // Check if contact already exists (handle NULL phone_id properly)
    console.log('Checking for existing contact with email_id:', emailData.id, 'phone_id:', phoneData?.id || null);
    
    // Track contact creation status
    let contactCreated = false;
    let contactErrorDetails: any = null;
    let newContact: any = null;
    
    // First, try to find by email_id and phone_id (if phone exists)
    let existingContact = null;
    let checkError = null;
    
    if (phoneData?.id) {
      // Check with both email and phone
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('email_id', emailData.id)
        .eq('phone_id', phoneData.id)
        .maybeSingle();
      existingContact = data;
      checkError = error;
      
      // If not found, also check by email only (in case phone was added later)
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
    } else {
      // Check by email only (phone is NULL)
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('email_id', emailData.id)
        .is('phone_id', null)
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
        email_id: emailData.id,
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
        to: ["knhoangre@gmail.com"],
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
                  ${realtorSection}
                </div>
              </div>
            </body>
          </html>
        `
      });
      console.log('Email sent successfully:', data);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data,
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

