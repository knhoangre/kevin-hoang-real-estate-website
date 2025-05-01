import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for elevated permissions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: {
          firstName: !firstName ? 'Missing first name' : null,
          lastName: !lastName ? 'Missing last name' : null,
          email: !email ? 'Missing email' : null,
          message: !message ? 'Missing message' : null
        }
      });
    }

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
        .insert({ first_name: firstName, is_active: true })
        .select()
        .single();

      if (newFirstNameError) throw newFirstNameError;
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
        .insert({ last_name: lastName, is_active: true })
        .select()
        .single();

      if (newLastNameError) throw newLastNameError;
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
        .insert({ email: email, is_active: true })
        .select()
        .single();

      if (newEmailError) throw newEmailError;
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
          .insert({ phone: formattedPhone, is_active: true })
          .select()
          .single();

        if (newPhoneError) throw newPhoneError;
        phoneData = newPhoneData;
      } else {
        phoneData = existingPhoneData;
      }
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
        is_active: true
      });

    if (messageError) throw messageError;

    // Send email notification using the Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/submit-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone: formattedPhone || '',
        message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge function error:', errorData);
      // Continue anyway, as the message was saved to the database
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}