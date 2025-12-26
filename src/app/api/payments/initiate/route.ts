import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'
import { initiateSTKPush } from '@/lib/mpesa/client'
import { PLAN_PRICES } from '@/types/database'

const initiatePaymentSchema = z.object({
  member_id: z.string().uuid().optional(),
  phone: z.string().regex(/^254[17]\d{8}$/),
  plan_type: z.enum(['day', 'week', 'month', 'quarterly', 'semi_annual', 'annual']),
  is_walkin: z.boolean().default(false),
  walkin_name: z.string().max(100).optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = initiatePaymentSchema.parse(body)

    const amount = PLAN_PRICES[data.plan_type]

    // Create pending payment record
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .insert({
        member_id: data.member_id || null,
        amount,
        plan_type: data.plan_type,
        phone_number: data.phone,
        status: 'pending',
        is_walkin: data.is_walkin,
        walkin_name: data.walkin_name,
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Skip M-Pesa in dev if not configured
    if (!process.env.MPESA_CONSUMER_KEY) {
      return NextResponse.json({
        success: true,
        payment_id: payment.id,
        amount,
        message: 'DEV MODE: M-Pesa not configured. Payment created as pending.',
        dev_mode: true,
      })
    }

    // Initiate STK Push
    const stkResponse = await initiateSTKPush({
      phone: data.phone,
      amount,
      accountReference: `FIT16-${payment.id.slice(0, 8)}`,
      transactionDesc: `Fitness16 ${data.plan_type} membership`,
    })

    if (stkResponse.ResponseCode !== '0') {
      // Update payment as failed
      await adminClient
        .from('payments')
        .update({ status: 'failed', failure_reason: stkResponse.ResponseDescription })
        .eq('id', payment.id)

      return NextResponse.json(
        { error: { code: 'MPESA_ERROR', message: stkResponse.ResponseDescription || 'STK Push failed' } },
        { status: 400 }
      )
    }

    // Update payment with checkout request ID
    await adminClient
      .from('payments')
      .update({ mpesa_checkout_request_id: stkResponse.CheckoutRequestID })
      .eq('id', payment.id)

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      checkout_request_id: stkResponse.CheckoutRequestID,
      amount,
      message: 'STK Push sent. Check your phone.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      )
    }
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}