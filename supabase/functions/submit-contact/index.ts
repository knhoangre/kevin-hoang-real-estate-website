import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@3.1.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
// This form is public, and what is typed into it lands in an HTML email, which
// since the Chinese pages also goes to someone outside this business. The email
// is built (and escaped) in the shared module.
import { contactEmail, pagePath } from '../_shared/contactMessage.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, phone, message, lang, page } = await req.json();

    // The Chinese contact form. Kevin does not read Chinese, so its messages go
    // to Maggie Li as well, and the source says how the person arrived. Her
    // address is fixed here and the request can only ask for this one thing: it
    // cannot name a recipient, so the flag cannot be used to mail anyone else.
    const fromChinesePage = lang === 'zh';

    if (!firstName || !lastName || !email || !message) {
      // console.log('Missing required fields:', { firstName, lastName, email, message: !!message });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: {
            firstName: !firstName ? 'Missing first name' : null,
            lastName: !lastName ? 'Missing last name' : null,
            email: !email ? 'Missing email' : null,
            message: !message ? 'Missing message' : null
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

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // console.log('Initialized Supabase client with service role key');

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
      .eq('first_name', firstName)
      .single();

    // If first name doesn't exist, insert it
    if (!firstNameData) {
      const { data: newFirstNameData, error: newFirstNameError } = await supabase
        .from('contact_first_names')
        .insert({ first_name: firstName })
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
      .eq('last_name', lastName)
      .single();

    // If last name doesn't exist, insert it
    if (!lastNameData) {
      const { data: newLastNameData, error: newLastNameError } = await supabase
        .from('contact_last_names')
        .insert({ last_name: lastName })
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
      .eq('email', email)
      .single();

    // If email doesn't exist, insert it
    if (!emailData) {
      const { data: newEmailData, error: newEmailError } = await supabase
        .from('contact_emails')
        .insert({ email: email })
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

    // Get or create "Website" source
    const contactSource = fromChinesePage ? "Website - Chinese (Maggie Li)" : "Website";
    let { data: sourceData, error: sourceError } = await supabase
      .from('contact_sources')
      .select('id')
      .eq('source', contactSource)
      .single();

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

    // Insert the message with the IDs
    const { error: messageError } = await supabase
      .from('contact_messages')
      .insert({
        first_name_id: firstNameData.id,
        last_name_id: lastNameData.id,
        email_id: emailData.id,
        phone_id: phoneData?.id || null,
        message: message,
        source_id: sourceData.id
      });

    if (messageError) {
      console.error('Error inserting message:', messageError);
      throw messageError;
    }

    // Also create/update contact in contacts table
    // Check if contact already exists (handle NULL phone_id properly)
    // console.log('Checking for existing contact with email_id:', emailData.id, 'phone_id:', phoneData?.id || null);
    
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
      // console.log('Found existing contact with id:', existingContact.id);
      // Update existing contact's source if needed
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
          source_id: sourceData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id);
      
      if (updateError) {
        console.error('Error updating existing contact:', updateError);
      } else {
        // console.log('Successfully updated existing contact');
      }
    } else {
      // console.log('No existing contact found, creating new contact');
      // Create new contact
      const contactData = {
        first_name_id: firstNameData.id,
        last_name_id: lastNameData.id,
        email_id: emailData.id,
        phone_id: phoneData?.id || null,
        source_id: sourceData.id,
        is_active: true,
      };
      // console.log('Inserting contact with data:', contactData);
      
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select('id')
        .single();

      if (contactError) {
        console.error('Error inserting contact:', contactError);
        console.error('Contact insert details:', contactData);
        console.error('Full error object:', JSON.stringify(contactError, null, 2));
        // Don't throw - message was inserted successfully, but log the error
      } else {
        // console.log('Successfully created new contact with id:', newContact?.id);
        // Verify the contact was actually created
        const { data: verifyContact, error: verifyError } = await supabase
          .from('contacts')
          .select('id, is_active')
          .eq('id', newContact.id)
          .single();
        if (verifyError) {
          console.error('Error verifying contact creation:', verifyError);
        } else {
          // console.log('Verified contact exists:', verifyContact);
        }
      }
    }

    // console.log('Database updated successfully');

    // Send email notification
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    // console.log('RESEND_API_KEY exists:', !!resendApiKey);
    // console.log('RESEND_API_KEY length:', resendApiKey?.length);

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
    const notice = contactEmail({
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email),
      phone: formattedPhone ? String(formattedPhone) : '',
      message: String(message),
      page: pagePath(page),
      zh: fromChinesePage,
    });

    try {
      const data = await resend.emails.send({
        from: "Kevin Hoang <contact@kevinhoang.co>",
        to: fromChinesePage
          ? ["maggie.li@raveis.com", "knhoangre@gmail.com"]
          : ["knhoangre@gmail.com"],
        // Spelled reply_to: resend@3.1.0 silently drops replyTo. Replying is
        // almost always the next thing to do, so it reaches the person.
        reply_to: email,
        subject: notice.subject,
        html: notice.html,
        text: notice.text,
      });

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: corsHeaders,
          status: 200
        }
      );
    } catch (error) {
      console.error('Resend API error:', error);
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
