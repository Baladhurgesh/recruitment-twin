import { NextRequest, NextResponse } from 'next/server';
import { supabase, ContactSubmission } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Server-side validation
    const { name, email, message, phone } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name is required and must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }
    
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message is required and must be at least 10 characters' },
        { status: 400 }
      );
    }
    
    if (phone && typeof phone === 'string' && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }
    
    // Prepare data for insertion
    const contactData: ContactSubmission = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      phone: phone?.trim() || null,
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save contact information' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, id: data.id },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

