'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import WeightStats from '@/components/progress/WeightStats'
import WeightChart from '@/components/progress/WeightChart'
import WeightLog from '@/components/progress/WeightLog'
import AddWeightModal from '@/components/progress/AddWeightModal'

interface WeightEntry {
  id: string
  kg: number
  date: string
  notes?: string
}

export default function ProgressPage() {
  const router = useRouter()
  const [memberId, setMemberId] = useState<string | null>(null)
  const [weights, setWeights] = useState<WeightEntry[]>([])
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

  // Fetch weights for member
  const fetchWeights = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/weights?member_id=${id}`)
      if (!res.ok) throw new Error('Failed to fetch weights')
      
      const data = await res.json()
      setWeights(data.weights || [])
    } catch (err) {
      console.error('Error fetching weights:', err)
      setError('Failed to load weight history')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const id = await checkAuth()
      if (id) {
        setMemberId(id)
        await fetchWeights(id)
      }
    }
    init()
  }, [checkAuth, fetchWeights])

  // Handle adding new weight
  const handleAddWeight = async (kg: number, notes?: string) => {
    if (!memberId) return
    
    setIsSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const res = await fetch('/api/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          member_id: memberId,
          kg, 
          date: today, 
          notes 
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to save weight')
      }

      // Refresh weight list
      await fetchWeights(memberId)
      setShowModal(false)
    } catch (err) {
      throw err // Re-throw so modal can display error
    } finally {
      setIsSaving(false)
    }
  }

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
          <h1 className="text-xl font-bold">Progress</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-linear-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
          >
            + Log Weight
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

        {/* Weight Stats */}
        <WeightStats weights={weights} goalWeight={70} />

        {/* Weight Chart */}
        <WeightChart weights={weights} />

        {/* Weight Log */}
        <WeightLog weights={weights} />
      </main>

      {/* Add Weight Modal */}
      <AddWeightModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddWeight}
        isLoading={isSaving}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}