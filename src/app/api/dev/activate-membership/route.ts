import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { PLAN_DAYS } from '@/types/database'

// DEV ONLY - Remove in production
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { member_id, plan_type = 'month' } = await req.json()

    if (!member_id) {
      return NextResponse.json({ error: 'member_id required' }, { status: 400 })
    }

    const startDate = new Date()
    const daysToAdd = PLAN_DAYS[plan_type as keyof typeof PLAN_DAYS] || 30
    const expiryDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)

    const { data: membership, error } = await adminClient
      .from('memberships')
      .insert({
        member_id,
        plan_type,
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'active',
        is_complimentary: true,
        notes: 'DEV: Test membership',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      membership: {
        id: membership.id,
        plan_type: membership.plan_type,
        expiry_date: membership.expiry_date,
      },
    })
  } catch (error) {
    console.error('Dev activate error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}