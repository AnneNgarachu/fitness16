import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'

const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  weekly_goal: z.number().min(1).max(7).optional(),
  workout_reminders: z.boolean().optional(),
  expiry_alerts: z.boolean().optional(),
  promotional_messages: z.boolean().optional(),
})

// GET /api/member/profile
export async function GET() {
  try {
    // Get member ID from session
    const session = await getSession()
    
    if (!session || session.userType !== 'member') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
        { status: 401 }
      )
    }

    const memberId = session.userId

    // Get member with active membership
    const { data: member, error } = await adminClient
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (error || !member) {
      // Try by phone if ID doesn't match
      const { data: memberByPhone, error: phoneError } = await adminClient
        .from('members')
        .select('*')
        .eq('phone', session.phone)
        .single()

      if (phoneError || !memberByPhone) {
        console.error('Member not found by ID or phone:', { memberId, phone: session.phone })
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Member not found' } },
          { status: 404 }
        )
      }

      // Use the member found by phone
      return await buildProfileResponse(memberByPhone)
    }

    return await buildProfileResponse(member)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

async function buildProfileResponse(member: Record<string, unknown>) {
  // Get active membership
  const { data: membership } = await adminClient
    .from('memberships')
    .select('*')
    .eq('member_id', member.id)
    .eq('status', 'active')
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: false })
    .limit(1)
    .single()

  // Calculate days remaining
  let daysRemaining = 0
  if (membership) {
    const expiry = new Date(membership.expiry_date as string)
    const today = new Date()
    daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return NextResponse.json({
    success: true,
    member: {
      id: member.id,
      phone: member.phone,
      email: member.email,
      first_name: member.first_name,
      last_name: member.last_name,
      home_location: member.home_location,
      referral_code: member.referral_code,
      current_streak: member.current_streak,
      longest_streak: member.longest_streak,
      weekly_goal: member.weekly_goal,
      workout_reminders: member.workout_reminders,
      expiry_alerts: member.expiry_alerts,
      promotional_messages: member.promotional_messages,
      created_at: member.created_at,
    },
    membership: membership ? {
      plan_type: membership.plan_type,
      start_date: membership.start_date,
      expiry_date: membership.expiry_date,
      days_remaining: daysRemaining,
      status: membership.status,
    } : null,
  })
}

// PUT /api/member/profile
export async function PUT(req: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.userType !== 'member') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = updateProfileSchema.parse(body)

    // Find member by phone (more reliable)
    const { data: existingMember } = await adminClient
      .from('members')
      .select('id')
      .eq('phone', session.phone)
      .single()

    if (!existingMember) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      )
    }

    const { data: member, error } = await adminClient
      .from('members')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMember.id)
      .select()
      .single()

    if (error || !member) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        weekly_goal: member.weekly_goal,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      )
    }
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}