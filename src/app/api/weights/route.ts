import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'

const createWeightSchema = z.object({
  member_id: z.string().uuid(),
  kg: z.number().min(20).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(200).optional(),
})

// GET /api/weights?member_id=xxx&limit=30
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')
    const limit = parseInt(searchParams.get('limit') || '30')

    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'member_id required' } },
        { status: 400 }
      )
    }

    const { data: weights, error } = await adminClient
      .from('weights')
      .select('*')
      .eq('member_id', memberId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      success: true,
      weights: weights.map(w => ({
        id: w.id,
        kg: w.kg,
        date: w.date,
        notes: w.notes,
      })),
    })
  } catch (error) {
    console.error('Weights fetch error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

// POST /api/weights
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createWeightSchema.parse(body)

    // Upsert - one weight entry per day
    const { data: weight, error } = await adminClient
      .from('weights')
      .upsert(
        {
          member_id: data.member_id,
          kg: data.kg,
          date: data.date,
          notes: data.notes,
        },
        { onConflict: 'member_id,date' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      weight: {
        id: weight.id,
        kg: weight.kg,
        date: weight.date,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      )
    }
    console.error('Weight create error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}