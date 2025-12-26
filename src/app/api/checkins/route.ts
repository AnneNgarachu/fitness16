import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'

const createCheckinSchema = z.object({
  member_id: z.string().uuid().optional(),
  location: z.enum(['juja', 'ruaka']),
  type: z.enum(['facial', 'manual', 'walkin']),
  registered_by: z.string().uuid().optional(), // staff ID
  walkin_name: z.string().max(100).optional(),
  walkin_phone: z.string().regex(/^254[17]\d{8}$/).optional(),
  payment_id: z.string().uuid().optional(),
})

// GET /api/checkins?location=juja&date=2025-12-24&limit=50
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const location = searchParams.get('location')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const memberId = searchParams.get('member_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = adminClient
      .from('checkins')
      .select(`
        *,
        members (id, first_name, last_name, phone)
      `)
      .gte('timestamp', `${date}T00:00:00`)
      .lte('timestamp', `${date}T23:59:59`)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (location) {
      query = query.eq('location', location)
    }

    if (memberId) {
      query = query.eq('member_id', memberId)
    }

    const { data: checkins, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      checkins: checkins.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        location: c.location,
        type: c.type,
        member: c.members ? {
          id: c.members.id,
          name: `${c.members.first_name} ${c.members.last_name}`,
          phone: c.members.phone,
        } : null,
        walkin_name: c.walkin_name,
        walkin_phone: c.walkin_phone,
      })),
      date,
      count: checkins.length,
    })
  } catch (error) {
    console.error('Checkins fetch error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

// POST /api/checkins
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createCheckinSchema.parse(body)

    // If member check-in, verify active membership
    if (data.member_id && data.type !== 'walkin') {
      const { data: membership } = await adminClient
        .from('memberships')
        .select('*')
        .eq('member_id', data.member_id)
        .eq('status', 'active')
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .single()

      if (!membership) {
        return NextResponse.json(
          { error: { code: 'NO_MEMBERSHIP', message: 'No active membership. Payment required.' } },
          { status: 400 }
        )
      }
    }

    // Walkin requires payment
    if (data.type === 'walkin' && !data.payment_id) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Walk-in requires payment_id' } },
        { status: 400 }
      )
    }

    // Check for duplicate check-in (same member, same day, same location)
    if (data.member_id) {
      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await adminClient
        .from('checkins')
        .select('id')
        .eq('member_id', data.member_id)
        .eq('location', data.location)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: { code: 'ALREADY_CHECKED_IN', message: 'Already checked in today at this location' } },
          { status: 400 }
        )
      }
    }

    // Create check-in
    const { data: checkin, error } = await adminClient
      .from('checkins')
      .insert({
        member_id: data.member_id,
        location: data.location,
        type: data.type,
        registered_by: data.registered_by,
        walkin_name: data.walkin_name,
        walkin_phone: data.walkin_phone,
        payment_id: data.payment_id,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Update member last_active
    if (data.member_id) {
      await adminClient
        .from('members')
        .update({ last_active: new Date().toISOString() })
        .eq('id', data.member_id)
    }

    return NextResponse.json({
      success: true,
      checkin: {
        id: checkin.id,
        timestamp: checkin.timestamp,
        location: checkin.location,
        type: checkin.type,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      )
    }
    console.error('Checkin create error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}