import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

// GET /api/payments/status?payment_id=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('payment_id')

    if (!paymentId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'payment_id required' } },
        { status: 400 }
      )
    }

    const { data: payment, error } = await adminClient
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (error || !payment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Payment not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        plan_type: payment.plan_type,
        mpesa_receipt: payment.mpesa_receipt_number,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
      },
    })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}