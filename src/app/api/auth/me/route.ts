import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not logged in' } },
      { status: 401 }
    )
  }

  if (session.userType === 'member') {
    const { data: member } = await adminClient
      .from('members')
      .select('id, phone, first_name, last_name, home_location, referral_code')
      .eq('id', session.userId)
      .single()

    return NextResponse.json({
      success: true,
      user: member,
      userType: 'member',
    })
  }

  if (session.userType === 'staff') {
    const { data: staff } = await adminClient
      .from('staff')
      .select('id, phone, name, role, location')
      .eq('id', session.userId)
      .single()

    return NextResponse.json({
      success: true,
      user: staff,
      userType: 'staff',
    })
  }

  return NextResponse.json(
    { error: { code: 'INVALID_SESSION', message: 'Invalid session' } },
    { status: 401 }
  )
}