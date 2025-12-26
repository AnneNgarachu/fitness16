import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'

const createWorkoutSchema = z.object({
  member_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  location: z.enum(['juja', 'ruaka']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
  duration_minutes: z.number().min(1).max(480).optional(),
  exercises: z.array(z.object({
    exercise_name: z.string().min(1).max(100),
    sets: z.number().min(1).max(100).optional(),
    reps: z.number().min(1).max(1000).optional(),
    weight_kg: z.number().min(0).max(1000).optional(),
  })).min(1).max(50),
})

// GET /api/workouts?member_id=xxx&limit=20&offset=0
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'member_id required' } },
        { status: 400 }
      )
    }

    // Get workouts with exercises
    const { data: workouts, error, count } = await adminClient
      .from('workouts')
      .select(`
        *,
        workout_exercises (*)
      `, { count: 'exact' })
      .eq('member_id', memberId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      workouts: workouts.map(w => ({
        id: w.id,
        name: w.name,
        location: w.location,
        date: w.date,
        notes: w.notes,
        duration_minutes: w.duration_minutes,
        exercises: w.workout_exercises,
        created_at: w.created_at,
      })),
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    })
  } catch (error) {
    console.error('Workouts fetch error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

// POST /api/workouts
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createWorkoutSchema.parse(body)

    // Validate date is not in future
    if (new Date(data.date) > new Date()) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Cannot log future workouts' } },
        { status: 400 }
      )
    }

    // Create workout
    const { data: workout, error: workoutError } = await adminClient
      .from('workouts')
      .insert({
        member_id: data.member_id,
        name: data.name,
        location: data.location,
        date: data.date,
        notes: data.notes,
        duration_minutes: data.duration_minutes,
      })
      .select()
      .single()

    if (workoutError) throw workoutError

    // Create exercises
    const exercises = data.exercises.map((ex, index) => ({
      workout_id: workout.id,
      exercise_name: ex.exercise_name,
      sets: ex.sets,
      reps: ex.reps,
      weight_kg: ex.weight_kg,
      order_index: index,
    }))

    const { error: exercisesError } = await adminClient
      .from('workout_exercises')
      .insert(exercises)

    if (exercisesError) throw exercisesError

    // Get workout count this week for streak tracking
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    const { count: weeklyCount } = await adminClient
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', data.member_id)
      .gte('date', startOfWeek.toISOString().split('T')[0])

    // Update last_active
    await adminClient
      .from('members')
      .update({ last_active: new Date().toISOString() })
      .eq('id', data.member_id)

    return NextResponse.json({
      success: true,
      workout: {
        id: workout.id,
        name: workout.name,
        date: workout.date,
        exercises_count: data.exercises.length,
      },
      weekly_count: weeklyCount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      )
    }
    console.error('Workout create error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}