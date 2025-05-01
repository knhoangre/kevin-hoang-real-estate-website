import { NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, message } = body;

    // First, insert the first name
    const { data: firstNameData, error: firstNameError } = await supabase
      .from('contact_first_names')
      .insert([{ first_name: firstName }])
      .select()
      .single();

    if (firstNameError) throw firstNameError;

    // Insert the last name
    const { data: lastNameData, error: lastNameError } = await supabase
      .from('contact_last_names')
      .insert([{ last_name: lastName }])
      .select()
      .single();

    if (lastNameError) throw lastNameError;

    // Insert the email
    const { data: emailData, error: emailError } = await supabase
      .from('contact_emails')
      .insert([{ email }])
      .select()
      .single();

    if (emailError) throw emailError;

    // Insert the phone
    const { data: phoneData, error: phoneError } = await supabase
      .from('contact_phones')
      .insert([{ phone }])
      .select()
      .single();

    if (phoneError) throw phoneError;

    // Finally, insert the message with all the references
    const { data: messageData, error: messageError } = await supabase
      .from('contact_messages')
      .insert([{
        message,
        first_name_id: firstNameData.id,
        last_name_id: lastNameData.id,
        email_id: emailData.id,
        phone_id: phoneData.id,
      }])
      .select()
      .single();

    if (messageError) throw messageError;

    return NextResponse.json(
      { message: 'Contact form submitted successfully', data: messageData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}