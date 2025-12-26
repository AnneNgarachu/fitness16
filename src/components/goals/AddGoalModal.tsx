'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface AddGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (goal: GoalInput) => Promise<void>
  isLoading?: boolean
}

interface GoalInput {
  icon: string
  title: string
  type: 'weight' | 'workout' | 'streak' | 'custom'
  target: number
  unit: string
  deadline?: string
}

interface GoalTemplate {
  icon: string
  title: string
  type: 'weight' | 'workout' | 'streak' | 'custom'
  defaultTarget: number
  unit: string
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  { icon: '⚖️', title: 'Lose Weight', type: 'weight', defaultTarget: 5, unit: 'kg' },
  { icon: '💪', title: 'Build Muscle', type: 'weight', defaultTarget: 3, unit: 'kg' },
  { icon: '🏋️', title: 'Workout Sessions', type: 'workout', defaultTarget: 20, unit: 'sessions' },
  { icon: '🔥', title: 'Week Streak', type: 'streak', defaultTarget: 8, unit: 'weeks' },
  { icon: '⏱️', title: 'Gym Time', type: 'custom', defaultTarget: 1000, unit: 'minutes' },
  { icon: '🎯', title: 'Custom Goal', type: 'custom', defaultTarget: 10, unit: 'times' },
]

export default function AddGoalModal({ isOpen, onClose, onSubmit, isLoading = false }: AddGoalModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null)
  const [goalData, setGoalData] = useState<GoalInput>({
    icon: '🎯',
    title: '',
    type: 'custom',
    target: 10,
    unit: 'times',
    deadline: '',
  })
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSelectTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template)
    setGoalData({
      icon: template.icon,
      title: template.title === 'Custom Goal' ? '' : template.title,
      type: template.type,
      target: template.defaultTarget,
      unit: template.unit,
      deadline: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!goalData.title.trim()) {
      setError('Please enter a goal title')
      return
    }

    if (goalData.target <= 0) {
      setError('Target must be greater than 0')
      return
    }

    try {
      await onSubmit({
        ...goalData,
        deadline: goalData.deadline || undefined,
      })
      // Reset form
      setSelectedTemplate(null)
      setGoalData({
        icon: '🎯',
        title: '',
        type: 'custom',
        target: 10,
        unit: 'times',
        deadline: '',
      })
      onClose()
    } catch {
      setError('Failed to create goal. Please try again.')
    }
  }

  const handleClose = () => {
    setSelectedTemplate(null)
    setGoalData({
      icon: '🎯',
      title: '',
      type: 'custom',
      target: 10,
      unit: 'times',
      deadline: '',
    })
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-t-3xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Add Goal</h2>
          <button onClick={handleClose} className="text-zinc-500 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {/* Goal Templates */}
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-3">Choose a goal type</label>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_TEMPLATES.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => handleSelectTemplate(template)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedTemplate?.title === template.title
                      ? 'bg-linear-to-r from-orange-500 to-pink-500'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{template.icon}</div>
                  <div className="text-xs font-medium truncate">{template.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Goal Title */}
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-2">Goal Title</label>
            <input
              type="text"
              value={goalData.title}
              onChange={(e) => setGoalData({ ...goalData, title: e.target.value })}
              placeholder="e.g., Lose 10kg by March"
              maxLength={100}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Target and Unit */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-2">Target</label>
              <input
                type="number"
                value={goalData.target}
                onChange={(e) => setGoalData({ ...goalData, target: parseInt(e.target.value) || 0 })}
                min="1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="w-28">
              <label className="block text-sm text-zinc-400 mb-2">Unit</label>
              <select
                value={goalData.unit}
                onChange={(e) => setGoalData({ ...goalData, unit: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 focus:outline-none focus:border-orange-500"
              >
                <option value="kg">kg</option>
                <option value="sessions">sessions</option>
                <option value="weeks">weeks</option>
                <option value="minutes">minutes</option>
                <option value="times">times</option>
                <option value="km">km</option>
              </select>
            </div>
          </div>

          {/* Deadline (Optional) */}
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-2">Deadline (optional)</label>
            <input
              type="date"
              value={goalData.deadline}
              onChange={(e) => setGoalData({ ...goalData, deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
          )}

          {/* Submit Button */}
          <Button type="submit" isLoading={isLoading} className="w-full">
            Create Goal
          </Button>
        </form>
      </div>
    </div>
  )
}