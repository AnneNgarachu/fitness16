'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'

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

export default function WorkoutsPage() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return null
      }
      const data = await res.json()
      return data.user.id
    } catch {
      router.push('/login')
      return null
    }
  }, [router])

  const fetchWorkouts = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/workouts?member_id=${id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      
      const data = await res.json()
      setWorkouts(data.workouts || [])
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const id = await checkAuth()
      if (id) {
        await fetchWorkouts(id)
      }
    }
    init()
  }, [checkAuth, fetchWorkouts])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <h1 className="text-2xl font-black">Workouts</h1>
        <Link
          href="/workouts/new"
          className="bg-linear-to-r from-orange-500 to-pink-500 px-4 py-2 rounded-xl font-bold text-sm"
        >
          + Log Workout
        </Link>
      </div>

      {/* Workout List */}
      <div className="px-5">
        {workouts.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">💪</div>
            <h2 className="font-bold text-lg mb-2">No workouts yet</h2>
            <p className="text-zinc-500 mb-4">Start logging your workouts to track progress</p>
            <Link
              href="/workouts/new"
              className="inline-block bg-linear-to-r from-orange-500 to-pink-500 px-6 py-3 rounded-xl font-bold"
            >
              Log Your First Workout
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <Link 
                key={workout.id} 
                href={`/workouts/${workout.id}`}
                className="block bg-zinc-900 rounded-xl p-4 hover:bg-zinc-800 active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{workout.name}</h3>
                    <p className="text-zinc-500 text-sm">
                      {formatDate(workout.date)} • {workout.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {workout.duration_minutes && (
                      <span className="text-zinc-500 text-sm">{workout.duration_minutes} min</span>
                    )}
                    <span className="text-zinc-500 text-lg">›</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {workout.exercises.slice(0, 3).map((ex, i) => (
                    <span key={i} className="bg-zinc-800 px-2 py-1 rounded text-xs">
                      {ex.exercise_name}
                    </span>
                  ))}
                  {workout.exercises.length > 3 && (
                    <span className="text-zinc-500 text-xs">+{workout.exercises.length - 3} more</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
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