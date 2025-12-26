'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface AddWeightModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (kg: number, notes?: string) => Promise<void>
  isLoading?: boolean
}

export default function AddWeightModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddWeightModalProps) {
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const kg = parseFloat(weight)
    
    // Validation
    if (isNaN(kg) || kg <= 0) {
      setError('Please enter a valid weight')
      return
    }
    if (kg < 20 || kg > 300) {
      setError('Weight must be between 20 and 300 kg')
      return
    }

    try {
      await onSubmit(kg, notes.trim() || undefined)
      // Reset form
      setWeight('')
      setNotes('')
      onClose()
    } catch {
      setError('Failed to save weight. Please try again.')
    }
  }

  const handleClose = () => {
    setWeight('')
    setNotes('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Log Weight</h2>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Weight Input */}
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75.5"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xl font-bold text-center focus:outline-none focus:border-orange-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Notes Input */}
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-2">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., After morning workout"
              maxLength={100}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            Save Weight
          </Button>
        </form>

        {/* Quick info */}
        <p className="text-xs text-zinc-500 text-center mt-4">
          You can only log one weight per day. Today&apos;s entry will be updated if you log again.
        </p>
      </div>
    </div>
  )
}