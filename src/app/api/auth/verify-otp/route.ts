import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { adminClient } from '@/lib/supabase/admin'
import { ValidationError, RateLimitError } from '@/lib/errors'
import { maskPhone } from '@/lib/utils/otp'
import { formatKenyanPhone, isValidKenyanPhone } from '@/lib/utils/phone'
import { createSession } from '@/lib/auth/session'

const MAX_OTP_ATTEMPTS = 3

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json()
  const rawPhone = body.phone
  const code = body.code
  const userType = body.userType || 'member'

  // Validate inputs
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new ValidationError('Phone number is required')
  }
  if (!code || typeof code !== 'string' || code.length !== 6) {
    throw new ValidationError('OTP must be 6 digits')
  }

  // Format and validate phone
  const phone = formatKenyanPhone(rawPhone)
  
  if (!isValidKenyanPhone(phone)) {
    throw new ValidationError('Invalid phone number')
  }

  // Get the latest unused OTP for this phone
  const { data: otpRecord, error: otpError } = await adminClient
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (otpError || !otpRecord) {
    throw new ValidationError('OTP expired or not found. Request a new one.')
  }

  // Check attempts
  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await adminClient
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id)

    throw new RateLimitError('Too many attempts. Request a new OTP.')
  }

  // Verify code
  if (otpRecord.code !== code) {
    await adminClient
      .from('otp_codes')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id)

    await adminClient.from('security_logs').insert({
      event_type: 'OTP_FAILED',
      details: { phone: maskPhone(phone), attempts: otpRecord.attempts + 1 },
    })

    throw new ValidationError('Invalid OTP code')
  }

  // Mark OTP as used
  await adminClient
    .from('otp_codes')
    .update({ used: true })
    .eq('id', otpRecord.id)

  // Handle staff login
  if (userType === 'staff') {
    const { data: staff } = await adminClient
      .from('staff')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single()

    if (!staff) {
      throw new ValidationError('Staff account not found or inactive')
    }

    // Log success
    await adminClient.from('security_logs').insert({
      event_type: 'STAFF_LOGIN',
      user_id: staff.id,
      user_type: 'staff',
      details: { phone: maskPhone(phone), role: staff.role },
    })

    // Create session for staff
    await createSession({
      userId: staff.id,
      userType: 'staff',
      phone: staff.phone,
    })

    return NextResponse.json({
      success: true,
      isNewUser: false,
      staff: {
        id: staff.id,
        phone: staff.phone,
        name: staff.name,
        role: staff.role,
      },
    })
  }

  // Handle member login
  const { data: member } = await adminClient
    .from('members')
    .select('*')
    .eq('phone', phone)
    .single()

  // Log success
  await adminClient.from('security_logs').insert({
    event_type: 'OTP_VERIFIED',
    user_id: member?.id,
    user_type: member ? 'member' : null,
    details: { phone: maskPhone(phone) },
  })

  if (member) {
    // Create session for existing member
    await createSession({
      userId: member.id,
      userType: 'member',
      phone: member.phone,
    })

    // Update last active
    await adminClient
      .from('members')
      .update({ last_active: new Date().toISOString() })
      .eq('id', member.id)

    return NextResponse.json({
      success: true,
      isNewUser: false,
      member: {
        id: member.id,
        phone: member.phone,
        first_name: member.first_name,
        last_name: member.last_name,
      },
    })
  }

  // New user — needs to complete signup
  return NextResponse.json({
    success: true,
    isNewUser: true,
    phone,
  })
})