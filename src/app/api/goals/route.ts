import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'

const createGoalSchema = z.object({
  member_id: z.string().uuid(),
  icon: z.string().max(10).default('🎯'),
  title: z.string().min(1).max(100),
  type: z.enum(['weight', 'workout', 'streak', 'custom']),
  target: z.number().min(0),
  unit: z.string().min(1).max(20),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

const updateGoalSchema = z.object({
  current: z.number().min(0).optional(),
  completed: z.boolean().optional(),
})

// GET /api/goals?member_id=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')

    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'member_id required' } },
        { status: 400 }
      )
    }

    const { data: goals, error } = await adminClient
      .from('goals')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      goals: goals.map(g => ({
        id: g.id,
        icon: g.icon,
        title: g.title,
        type: g.type,
        target: g.target,
        current: g.current,
        unit: g.unit,
        deadline: g.deadline,
        completed: g.completed,
        completed_at: g.completed_at,
        progress: Math.min(100, Math.round((g.current / g.target) * 100)),
      })),
    })
  } catch (error) {
    console.error('Goals fetch error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

// POST /api/goals
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createGoalSchema.parse(body)

    const { data: goal, error } = await adminClient
      .from('goals')
      .insert({
        member_id: data.member_id,
        icon: data.icon,
        title: data.title,
        type: data.type,
        target: data.target,
        unit: data.unit,
        deadline: data.deadline,
        current: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      goal: {
        id: goal.id,
        icon: goal.icon,
        title: goal.title,
        target: goal.target,
        unit: goal.unit,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      )
    }
    console.error('Goal create error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

// PUT /api/goals (update progress)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { goal_id, ...updateData } = body

    if (!goal_id) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'goal_id required' } },
        { status: 400 }
      )
    }

    const validatedData = updateGoalSchema.parse(updateData)

    // Check if goal is being completed
    const updatePayload: Record<string, unknown> = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    }

    if (validatedData.completed) {
      updatePayload.completed_at = new Date().toISOString()
    }

    const { data: goal, error } = await adminClient
      .from('goals')
      .update(updatePayload)
      .eq('id', goal_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      goal: {
        id: goal.id,
        current: goal.current,
        completed: goal.completed,
        progress: Math.min(100, Math.round((goal.current / goal.target) * 100)),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      )
    }
    console.error('Goal update error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

// DELETE /api/goals
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const goalId = searchParams.get('goal_id')

    if (!goalId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'goal_id required' } },
        { status: 400 }
      )
    }

    const { error } = await adminClient
      .from('goals')
      .delete()
      .eq('id', goalId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Goal delete error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}