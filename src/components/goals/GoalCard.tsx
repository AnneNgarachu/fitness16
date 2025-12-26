'use client'

import { useState } from 'react'

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

interface GoalCardProps {
  goal: Goal
  onUpdate: (goalId: string, current: number) => Promise<void>
  onComplete: (goalId: string) => Promise<void>
  onDelete: (goalId: string) => Promise<void>
}

export default function GoalCard({ goal, onUpdate, onComplete, onDelete }: GoalCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [newProgress, setNewProgress] = useState(goal.current.toString())

  const handleUpdateProgress = async () => {
    const value = parseFloat(newProgress)
    if (isNaN(value) || value < 0) return
    
    setIsUpdating(true)
    try {
      await onUpdate(goal.id, value)
    } finally {
      setIsUpdating(false)
      setShowActions(false)
    }
  }

  const handleComplete = async () => {
    setIsUpdating(true)
    try {
      await onComplete(goal.id)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Delete this goal?')) {
      await onDelete(goal.id)
    }
  }

  const progressColor = goal.completed 
    ? 'bg-green-500' 
    : goal.progress >= 75 
      ? 'bg-orange-500' 
      : 'bg-gradient-to-r from-orange-500 to-pink-500'

  return (
    <div className={`bg-zinc-900 rounded-xl p-4 ${goal.completed ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{goal.icon}</span>
          <div>
            <h3 className={`font-semibold ${goal.completed ? 'line-through text-zinc-500' : ''}`}>
              {goal.title}
            </h3>
            {goal.deadline && !goal.completed && (
              <p className="text-xs text-zinc-500">
                Due: {formatDate(goal.deadline)}
              </p>
            )}
          </div>
        </div>
        
        {!goal.completed && (
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-zinc-500 hover:text-white p-1"
          >
            •••
          </button>
        )}
        
        {goal.completed && (
          <span className="text-green-500 text-sm font-medium">✓ Done</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-zinc-400">
            {goal.current} / {goal.target} {goal.unit}
          </span>
          <span className="text-zinc-500">{goal.progress}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${Math.min(100, goal.progress)}%` }}
          />
        </div>
      </div>

      {/* Actions Panel */}
      {showActions && !goal.completed && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={newProgress}
              onChange={(e) => setNewProgress(e.target.value)}
              className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm"
              placeholder="Update progress"
            />
            <button
              onClick={handleUpdateProgress}
              disabled={isUpdating}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isUpdating ? '...' : 'Update'}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleComplete}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              ✓ Mark Complete
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600/20 text-red-500 hover:bg-red-600/30 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}