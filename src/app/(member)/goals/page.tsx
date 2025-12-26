'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import GoalCard from '@/components/goals/GoalCard'
import AddGoalModal from '@/components/goals/AddGoalModal'

interface Goal {
  id: string
  icon: string
  title: string
  type: 'weight' | 'workout' | 'streak' | 'custom'
  target: number
  current: number
  unit: string
  deadline: string | null
  completed: boolean
  progress: number
}

interface GoalInput {
  icon: string
  title: string
  type: 'weight' | 'workout' | 'streak' | 'custom'
  target: number
  unit: string
  deadline?: string
}

export default function GoalsPage() {
  const router = useRouter()
  const [memberId, setMemberId] = useState<string | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  // Check auth and get member ID
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

  // Fetch goals for member
  const fetchGoals = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/goals?member_id=${id}`)
      if (!res.ok) throw new Error('Failed to fetch goals')
      
      const data = await res.json()
      setGoals(data.goals || [])
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError('Failed to load goals')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const id = await checkAuth()
      if (id) {
        setMemberId(id)
        await fetchGoals(id)
      }
    }
    init()
  }, [checkAuth, fetchGoals])

  // Create new goal
  const handleCreateGoal = async (goalInput: GoalInput) => {
    if (!memberId) return
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          ...goalInput,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to create goal')
      }

      await fetchGoals(memberId)
      setShowModal(false)
    } catch (err) {
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  // Update goal progress
  const handleUpdateGoal = async (goalId: string, current: number) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: goalId, current }),
      })

      if (!res.ok) throw new Error('Failed to update goal')

      if (memberId) await fetchGoals(memberId)
    } catch (err) {
      console.error('Error updating goal:', err)
      throw err
    }
  }

  // Mark goal as complete
  const handleCompleteGoal = async (goalId: string) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: goalId, completed: true }),
      })

      if (!res.ok) throw new Error('Failed to complete goal')

      if (memberId) await fetchGoals(memberId)
    } catch (err) {
      console.error('Error completing goal:', err)
      throw err
    }
  }

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    try {
      const res = await fetch(`/api/goals?goal_id=${goalId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete goal')

      if (memberId) await fetchGoals(memberId)
    } catch (err) {
      console.error('Error deleting goal:', err)
    }
  }

  // Separate active and completed goals
  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-zinc-800 px-4 py-4 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Goals</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-linear-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
          >
            + Add Goal
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Active Goals */}
        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="font-bold text-lg mb-2">No goals yet</h2>
            <p className="text-zinc-500 mb-4">Set goals to track your fitness journey</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-linear-to-r from-orange-500 to-pink-500 px-6 py-3 rounded-xl font-bold"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <>
            {/* Active Goals Section */}
            {activeGoals.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                  Active ({activeGoals.length})
                </h2>
                <div className="space-y-3">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdate={handleUpdateGoal}
                      onComplete={handleCompleteGoal}
                      onDelete={handleDeleteGoal}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Goals Section */}
            {completedGoals.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                  Completed ({completedGoals.length})
                </h2>
                <div className="space-y-3">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdate={handleUpdateGoal}
                      onComplete={handleCompleteGoal}
                      onDelete={handleDeleteGoal}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateGoal}
        isLoading={isSaving}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
