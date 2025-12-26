import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { adminClient } from '@/lib/supabase/admin';

const walkInSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^(0|254)[17]\d{8}$/),
  location: z.enum(['juja', 'ruaka']),
  plan_type: z.enum(['day', 'week', 'month']),
});

const PLAN_PRICES: Record<string, number> = {
  day: 500,
  week: 2000,
  month: 5500,
};

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session || session.userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = walkInSchema.parse(body);

    // Format phone number
    let formattedPhone = data.phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    }

    const amount = PLAN_PRICES[data.plan_type];

    // Create pending payment for walk-in
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .insert({
        amount,
        plan_type: data.plan_type,
        phone_number: formattedPhone,
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    // Record check-in as walk-in
    const { error: checkInError } = await adminClient
      .from('checkins')
      .insert({
        location: data.location,
        type: 'walkin',
        walkin_name: data.name,
        walkin_phone: formattedPhone,
        payment_id: payment.id,
        registered_by: session.userId,
      });

    if (checkInError) {
      console.error('Check-in creation error:', checkInError);
    }

    // In production, initiate M-Pesa STK Push here
    // For now, return success with payment info

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      amount,
      message: `Walk-in registered. Send M-Pesa prompt to ${formattedPhone}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Walk-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}