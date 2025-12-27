import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { generateOtp, maskPhone } from '@/lib/utils/otp'
import { formatKenyanPhone, isValidKenyanPhone } from '@/lib/utils/phone'
import { adminClient } from '@/lib/supabase/admin'
import { RateLimitError, ValidationError } from '@/lib/errors'

const OTP_EXPIRY_MINUTES = 10
const MAX_OTP_REQUESTS_PER_HOUR = 5

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json()
  const rawPhone = body.phone
  
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new ValidationError('Phone number is required')
  }
  
  // Format and validate phone
  const phone = formatKenyanPhone(rawPhone)
  
  // DEBUG - remove before production
  console.log('[DEBUG] Raw phone:', rawPhone)
  console.log('[DEBUG] Formatted phone:', phone)
  console.log('[DEBUG] Is valid:', isValidKenyanPhone(phone))
  
  if (!isValidKenyanPhone(phone)) {
    throw new ValidationError('Invalid phone number. Use format: 0712345678 or 254712345678')
  }

  // Check rate limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { count } = await adminClient
    .from('otp_codes')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', oneHourAgo)

  if (count && count >= MAX_OTP_REQUESTS_PER_HOUR) {
    throw new RateLimitError('Too many OTP requests. Try again in 1 hour.')
  }

  // Generate OTP
  const code = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()

  // Store OTP
  await adminClient.from('otp_codes').insert({
    phone,
    code,
    expires_at: expiresAt,
  })

  // TODO: Send SMS via Africa's Talking or Twilio
  console.log(`[DEV] OTP for ${maskPhone(phone)}: ${code}`)

  // Log security event
  await adminClient.from('security_logs').insert({
    event_type: 'OTP_SENT',
    details: { phone: maskPhone(phone) },
  })

  return NextResponse.json({
    success: true,
    message: 'OTP sent successfully',
    dev_otp: code,  // REMOVE AFTER DEMO - returns OTP for auto-fill
  })
})