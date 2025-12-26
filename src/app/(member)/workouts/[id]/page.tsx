'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Exercise {
  exercise_name: string
  sets: number | null
  reps: number | null
  weight_kg: number | null
}

interface Workout {
  id: string
  name: string
  location: string
  date: string
  duration_minutes: number | null
  exercises: Exercise[]
}

export default function WorkoutDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workoutId = params.id as string
  
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchWorkout = useCallback(async () => {
    try {
      const res = await fetch(`/api/workouts/${workoutId}`)
      if (!res.ok) {
        router.push('/workouts')
        return
      }
      const data = await res.json()
      setWorkout(data.workout)
    } catch (error) {
      console.error('Error:', error)
      router.push('/workouts')
    } finally {
      setIsLoading(false)
    }
  }, [workoutId, router])

  useEffect(() => {
    fetchWorkout()
  }, [fetchWorkout])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/workouts')
    } catch (error) {
      console.error('Delete error:', error)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Workout not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workouts" className="text-zinc-500 hover:text-white">
            ← Back
          </Link>
          <h1 className="text-xl font-black">{workout.name}</h1>
        </div>
        <Link
          href={`/workouts/${workoutId}/edit`}
          className="text-orange-500 font-semibold text-sm hover:underline"
        >
          Edit
        </Link>
      </div>

      <div className="px-5 space-y-6">
        {/* Workout Info */}
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-zinc-500">Date</p>
              <p className="font-semibold">{formatDate(workout.date)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Location</p>
              <p className="font-semibold capitalize">{workout.location}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Duration</p>
              <p className="font-semibold">{workout.duration_minutes || '-'} min</p>
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div>
          <h2 className="font-bold text-lg mb-3">Exercises ({workout.exercises.length})</h2>
          <div className="space-y-3">
            {workout.exercises.map((ex, index) => (
              <div key={index} className="bg-zinc-900 rounded-xl p-4">
                <h3 className="font-semibold mb-2">{ex.exercise_name}</h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-zinc-400">
                    <span className="text-white font-medium">{ex.sets}</span> sets
                  </span>
                  <span className="text-zinc-400">
                    <span className="text-white font-medium">{ex.reps}</span> reps
                  </span>
                  {ex.weight_kg && (
                    <span className="text-zinc-400">
                      <span className="text-white font-medium">{ex.weight_kg}</span> kg
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-3 rounded-xl border border-red-500/50 text-red-500 font-semibold hover:bg-red-500/10 transition-colors"
        >
          Delete Workout
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-5">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-2">Delete Workout?</h2>
            <p className="text-zinc-400 mb-6">
              This will permanently delete this workout and all exercises.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 font-semibold"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 font-semibold"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}