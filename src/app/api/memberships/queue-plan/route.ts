import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { adminClient } from '@/lib/supabase/admin';
import { initiateSTKPush } from '@/lib/mpesa/client';
import { PLAN_PRICES } from '@/types/database';

const queuePlanSchema = z.object({
  member_id: z.string().uuid(),
  plan_type: z.enum(['day', 'week', 'month', 'quarterly', 'semi_annual', 'annual']),
  phone: z.string().regex(/^254[17]\d{8}$/),
});

// POST /api/memberships/queue-plan - Queue next plan for member
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = queuePlanSchema.parse(body);

    // Get current membership
    const { data: membership, error: membershipError } = await adminClient
      .from('memberships')
      .select('*')
      .eq('member_id', data.member_id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: { code: 'NO_MEMBERSHIP', message: 'No active membership found' } },
        { status: 400 }
      );
    }

    // Check if there's already a queued plan
    if (membership.next_plan_type && membership.next_plan_paid) {
      return NextResponse.json(
        { error: { code: 'PLAN_QUEUED', message: `Already have ${membership.next_plan_type} plan queued` } },
        { status: 400 }
      );
    }

    const amount = PLAN_PRICES[data.plan_type];

    // Create pending payment for the next plan
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .insert({
        member_id: data.member_id,
        amount,
        plan_type: data.plan_type,
        phone_number: data.phone,
        status: 'pending',
        is_walkin: false,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment create error:', paymentError);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    // Update membership with queued plan (not paid yet)
    await adminClient
      .from('memberships')
      .update({
        next_plan_type: data.plan_type,
        next_plan_paid: false,
        next_plan_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.id);

    // Skip M-Pesa in dev if not configured
    if (!process.env.MPESA_CONSUMER_KEY) {
      return NextResponse.json({
        success: true,
        payment_id: payment.id,
        amount,
        current_plan: membership.plan_type,
        next_plan: data.plan_type,
        starts_on: membership.expiry_date,
        message: 'DEV MODE: M-Pesa not configured. Plan queued as pending.',
        dev_mode: true,
      });
    }

    // Initiate STK Push
    const stkResponse = await initiateSTKPush({
      phone: data.phone,
      amount,
      accountReference: `FIT16-UP-${payment.id.slice(0, 8)}`,
      transactionDesc: `Fitness16 ${data.plan_type} - starts after current plan`,
    });

    if (stkResponse.ResponseCode !== '0') {
      // Update payment as failed
      await adminClient
        .from('payments')
        .update({ status: 'failed', failure_reason: stkResponse.ResponseDescription })
        .eq('id', payment.id);

      // Clear queued plan
      await adminClient
        .from('memberships')
        .update({
          next_plan_type: null,
          next_plan_paid: false,
          next_plan_payment_id: null,
        })
        .eq('id', membership.id);

      return NextResponse.json(
        { error: { code: 'MPESA_ERROR', message: stkResponse.ResponseDescription || 'STK Push failed' } },
        { status: 400 }
      );
    }

    // Update payment with checkout request ID
    await adminClient
      .from('payments')
      .update({ mpesa_checkout_request_id: stkResponse.CheckoutRequestID })
      .eq('id', payment.id);

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      checkout_request_id: stkResponse.CheckoutRequestID,
      amount,
      current_plan: membership.plan_type,
      next_plan: data.plan_type,
      starts_on: membership.expiry_date,
      message: `STK Push sent. ${data.plan_type} plan will start after current plan expires.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      );
    }
    console.error('Queue plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/memberships/queue-plan - Get queued plan info
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'member_id required' } },
        { status: 400 }
      );
    }

    const { data: membership, error } = await adminClient
      .from('memberships')
      .select('plan_type, expiry_date, next_plan_type, next_plan_paid')
      .eq('member_id', memberId)
      .eq('status', 'active')
      .single();

    if (error || !membership) {
      return NextResponse.json({ queued_plan: null });
    }

    return NextResponse.json({
      current_plan: membership.plan_type,
      expiry_date: membership.expiry_date,
      queued_plan: membership.next_plan_type,
      queued_plan_paid: membership.next_plan_paid,
    });
  } catch (error) {
    console.error('Get queued plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/memberships/queue-plan - Cancel queued plan
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'member_id required' } },
        { status: 400 }
      );
    }

    const { data: membership } = await adminClient
      .from('memberships')
      .select('id, next_plan_paid, next_plan_payment_id')
      .eq('member_id', memberId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No active membership' }, { status: 400 });
    }

    // Can only cancel if not yet paid
    if (membership.next_plan_paid) {
      return NextResponse.json(
        { error: { code: 'ALREADY_PAID', message: 'Cannot cancel - plan already paid. Contact admin for refund.' } },
        { status: 400 }
      );
    }

    // Clear queued plan
    await adminClient
      .from('memberships')
      .update({
        next_plan_type: null,
        next_plan_paid: false,
        next_plan_payment_id: null,
      })
      .eq('id', membership.id);

    // Cancel pending payment if exists
    if (membership.next_plan_payment_id) {
      await adminClient
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('id', membership.next_plan_payment_id);
    }

    return NextResponse.json({ success: true, message: 'Queued plan cancelled' });
  } catch (error) {
    console.error('Cancel queued plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}