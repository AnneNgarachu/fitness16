'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GYM, EQUIPMENT } from '@/lib/constants'

interface Exercise {
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number | null
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [memberId, setMemberId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [customExercise, setCustomExercise] = useState('')

  const [workout, setWorkout] = useState({
    name: '',
    location: 'juja',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 45,
  })

  const [exercises, setExercises] = useState<Exercise[]>([])

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setMemberId(data.user.id)
    } catch {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const addExercise = (name: string) => {
    if (!exercises.find(e => e.exercise_name === name)) {
      setExercises([...exercises, { exercise_name: name, sets: 3, reps: 10, weight_kg: null }])
    }
    setShowExercisePicker(false)
  }

  const addCustomExercise = () => {
    if (customExercise.trim()) {
      addExercise(customExercise.trim())
      setCustomExercise('')
    }
  }

  const updateExercise = (index: number, field: keyof Exercise, value: number | null) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')

    if (!workout.name) {
      setError('Please enter a workout name')
      return
    }

    if (exercises.length === 0) {
      setError('Please add at least one exercise')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          name: workout.name,
          location: workout.location,
          date: workout.date,
          duration_minutes: workout.duration_minutes,
          exercises,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save workout')
      }

      router.push('/workouts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      {/* Header */}
      <div className="p-5 flex items-center gap-4">
        <Link href="/workouts" className="text-zinc-500 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-xl font-black">Log Workout</h1>
      </div>

      <div className="px-5 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Workout Details */}
        <div className="space-y-4">
          <Input
            label="Workout Name"
            placeholder="e.g., Leg Day, Push Day"
            value={workout.name}
            onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
          />

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Location</label>
            <div className="grid grid-cols-2 gap-3">
              {GYM.locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setWorkout({ ...workout, location: loc.id })}
                  className={`p-3 rounded-xl text-center transition-all ${
                    workout.location === loc.id
                      ? 'bg-linear-to-r from-orange-500 to-pink-500'
                      : 'bg-zinc-900 border border-zinc-700'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={workout.date}
              onChange={(e) => setWorkout({ ...workout, date: e.target.value })}
            />
            <Input
              label="Duration (min)"
              type="number"
              value={workout.duration_minutes.toString()}
              onChange={(e) => setWorkout({ ...workout, duration_minutes: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Exercises */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Exercises ({exercises.length})</h2>
            <button
              onClick={() => setShowExercisePicker(true)}
              className="text-orange-500 font-semibold text-sm"
            >
              + Add Exercise
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="bg-zinc-900 rounded-xl p-6 text-center">
              <p className="text-zinc-500">No exercises added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex, index) => (
                <div key={index} className="bg-zinc-900 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold">{ex.exercise_name}</h3>
                    <button onClick={() => removeExercise(index)} className="text-red-500 text-sm">
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500">Sets</label>
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 bg-zinc-800 rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Reps</label>
                      <input
                        type="number"
                        value={ex.reps}
                        onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 bg-zinc-800 rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Weight (kg)</label>
                      <input
                        type="number"
                        value={ex.weight_kg || ''}
                        onChange={(e) => updateExercise(index, 'weight_kg', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full mt-1 px-3 py-2 bg-zinc-800 rounded-lg text-center"
                        placeholder="-"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={!workout.name || exercises.length === 0}
        >
          Save Workout
        </Button>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-zinc-900 w-full rounded-t-3xl max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="font-bold text-lg">Add Exercise</h2>
              <button onClick={() => setShowExercisePicker(false)} className="text-zinc-500">
                ✕
              </button>
            </div>

            {/* Custom Exercise */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Custom exercise name..."
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                  className="flex-1 px-4 py-3 bg-zinc-800 rounded-xl"
                />
                <button onClick={addCustomExercise} className="px-4 py-3 bg-orange-500 rounded-xl font-bold">
                  Add
                </button>
              </div>
            </div>

            {/* Equipment List */}
            <div className="overflow-y-auto max-h-[50vh] p-4">
              {EQUIPMENT.map((category) => (
                <div key={category.category} className="mb-6">
                  <h3 className="text-zinc-500 text-sm font-semibold mb-2">{category.category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <button
                        key={item}
                        onClick={() => addExercise(item)}
                        disabled={exercises.some(e => e.exercise_name === item)}
                        className={`px-4 py-2 rounded-full text-sm transition-all ${
                          exercises.some(e => e.exercise_name === item)
                            ? 'bg-zinc-700 text-zinc-500'
                            : 'bg-zinc-800 hover:bg-orange-500'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}