import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'

const updateWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.enum(['juja', 'ruaka']),
  date: z.string(),
  duration_minutes: z.number().min(1).max(480).optional(),
  exercises: z.array(z.object({
    exercise_name: z.string().min(1),
    sets: z.number().min(1),
    reps: z.number().min(1),
    weight_kg: z.number().nullable(),
  })).min(1),
})

// GET single workout
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session || session.userType !== 'member') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
        { status: 401 }
      )
    }

    const { data: workout, error } = await adminClient
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !workout) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Workout not found' } },
        { status: 404 }
      )
    }

    const { data: exercises } = await adminClient
      .from('workout_exercises')
      .select('exercise_name, sets, reps, weight_kg')
      .eq('workout_id', id)
      .order('id', { ascending: true })

    return NextResponse.json({
      workout: {
        ...workout,
        exercises: exercises || [],
      },
    })
  } catch (error) {
    console.error('Workout fetch error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

// PUT update workout
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session || session.userType !== 'member') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = updateWorkoutSchema.parse(body)

    // Find member by phone
    const { data: member } = await adminClient
      .from('members')
      .select('id')
      .eq('phone', session.phone)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      )
    }

    // Check workout belongs to member
    const { data: existingWorkout } = await adminClient
      .from('workouts')
      .select('id, member_id')
      .eq('id', id)
      .single()

    if (!existingWorkout || existingWorkout.member_id !== member.id) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Workout not found' } },
        { status: 404 }
      )
    }

    // Update workout
    const { error: workoutError } = await adminClient
      .from('workouts')
      .update({
        name: validated.name,
        location: validated.location,
        date: validated.date,
        duration_minutes: validated.duration_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (workoutError) throw workoutError

    // Delete old exercises
    await adminClient
      .from('workout_exercises')
      .delete()
      .eq('workout_id', id)

    // Insert new exercises
    if (validated.exercises.length > 0) {
      const { error: exercisesError } = await adminClient
        .from('workout_exercises')
        .insert(
          validated.exercises.map(ex => ({
            workout_id: id,
            exercise_name: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps,
            weight_kg: ex.weight_kg,
          }))
        )

      if (exercisesError) throw exercisesError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message || 'Invalid input' } },
        { status: 400 }
      )
    }
    console.error('Workout update error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

// DELETE workout
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session || session.userType !== 'member') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
        { status: 401 }
      )
    }

    const { data: member } = await adminClient
      .from('members')
      .select('id')
      .eq('phone', session.phone)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      )
    }

    const { data: workout } = await adminClient
      .from('workouts')
      .select('id, member_id')
      .eq('id', id)
      .single()

    if (!workout || workout.member_id !== member.id) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Workout not found' } },
        { status: 404 }
      )
    }

    await adminClient
      .from('workout_exercises')
      .delete()
      .eq('workout_id', id)

    const { error } = await adminClient
      .from('workouts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Workout delete error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}