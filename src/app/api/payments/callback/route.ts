import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { PLAN_DAYS } from '@/types/database'

// Safaricom IPs (verify these are current)
const SAFARICOM_IPS = [
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136',
  '196.201.212.74',
  '196.201.212.69',
]

export async function POST(req: Request) {
  try {
    // Get client IP
    const forwardedFor = req.headers.get('x-forwarded-for')
    const clientIp = forwardedFor?.split(',')[0]?.trim()

    // Verify Safaricom IP in production
    if (process.env.NODE_ENV === 'production' && clientIp && !SAFARICOM_IPS.includes(clientIp)) {
      console.error('Unauthorized callback IP:', clientIp)
      await adminClient.from('security_logs').insert({
        event_type: 'MPESA_CALLBACK_BLOCKED',
        ip_address: clientIp,
        details: { reason: 'Unauthorized IP' },
      })
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unauthorized' })
    }

    const body = await req.json()
    const callback = body.Body?.stkCallback

    if (!callback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback' })
    }

    const checkoutRequestId = callback.CheckoutRequestID
    const resultCode = callback.ResultCode
    const resultDesc = callback.ResultDesc

    // Find the payment
    const { data: payment, error: findError } = await adminClient
      .from('payments')
      .select('*')
      .eq('mpesa_checkout_request_id', checkoutRequestId)
      .single()

    if (findError || !payment) {
      console.error('Payment not found for checkout:', checkoutRequestId)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    // Check for duplicate callback
    if (payment.status === 'completed') {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already processed' })
    }

    if (resultCode !== 0) {
      // Payment failed
      await adminClient
        .from('payments')
        .update({
          status: 'failed',
          failure_reason: resultDesc,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    // Extract callback metadata
    const metadata = callback.CallbackMetadata?.Item || []
    const receiptNumber = metadata.find((i: { Name: string }) => i.Name === 'MpesaReceiptNumber')?.Value
    const transactionDate = metadata.find((i: { Name: string }) => i.Name === 'TransactionDate')?.Value
    const amount = metadata.find((i: { Name: string }) => i.Name === 'Amount')?.Value

    // Verify amount matches
    if (amount && amount !== payment.amount) {
      await adminClient.from('security_logs').insert({
        event_type: 'MPESA_AMOUNT_MISMATCH',
        user_id: payment.member_id,
        details: { expected: payment.amount, received: amount, payment_id: payment.id },
      })
    }

    // Update payment as completed
    await adminClient
      .from('payments')
      .update({
        status: 'completed',
        mpesa_receipt_number: receiptNumber,
        mpesa_transaction_id: transactionDate?.toString(),
        verified_with_safaricom: true,
        verification_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    // Create membership if member exists
    if (payment.member_id) {
      const startDate = new Date()
      const daysToAdd = PLAN_DAYS[payment.plan_type as keyof typeof PLAN_DAYS]
      const expiryDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)

      await adminClient.from('memberships').insert({
        member_id: payment.member_id,
        plan_type: payment.plan_type,
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'active',
        payment_id: payment.id,
      })

      // Log security event
      await adminClient.from('security_logs').insert({
        event_type: 'MEMBERSHIP_ACTIVATED',
        user_id: payment.member_id,
        user_type: 'member',
        details: {
          payment_id: payment.id,
          plan_type: payment.plan_type,
          receipt: receiptNumber,
        },
      })
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    console.error('Callback processing error:', error)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}