'use client'

import { useState } from 'react'

interface DangerZoneProps {
  memberId: string
  onLogout: () => void
}

export default function DangerZone({ memberId, onLogout }: DangerZoneProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const res = await fetch(`/api/member/export?member_id=${memberId}`)
      if (!res.ok) throw new Error('Export failed')
      
      const data = await res.json()
      
      // Convert to readable CSV format
      const csvContent = generateCSV(data.data)
      
      // Download as CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-fitness16-data-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    alert('Account deletion requested. This feature will be implemented with admin approval flow.')
    setShowDeleteConfirm(false)
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-5">
      <h3 className="font-bold mb-4 text-zinc-400">Account</h3>
      
      {/* Export Data */}
      <button
        onClick={handleExportData}
        disabled={isExporting}
        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors mb-2"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📦</span>
          <span>Export My Data</span>
        </div>
        <span className="text-zinc-500 text-sm">
          {isExporting ? 'Exporting...' : 'CSV'}
        </span>
      </button>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors mb-2"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🚪</span>
          <span>Log Out</span>
        </div>
        <span className="text-zinc-500">→</span>
      </button>

      {/* Delete Account */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <span className="text-xl">⚠️</span>
        <span>Delete Account</span>
      </button>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-zinc-900 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2">Delete Account?</h3>
            <p className="text-zinc-500 text-sm mb-6">
              This will permanently delete all your data including workouts, progress, and goals. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 rounded-xl bg-red-600 font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Convert data to user-friendly CSV
function generateCSV(data: Record<string, unknown>): string {
  const lines: string[] = []
  
  // Header
  lines.push('MY FITNESS 16 DATA EXPORT')
  lines.push(`Exported on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`)
  lines.push('')
  
  // Personal Info
  const personal = data.personal_information as Record<string, unknown>
  lines.push('=== PERSONAL INFORMATION ===')
  lines.push(`Name: ${personal.first_name} ${personal.last_name}`)
  lines.push(`Phone: ${personal.phone}`)
  lines.push(`Email: ${personal.email || 'Not provided'}`)
  lines.push(`Home Gym: ${personal.home_location}`)
  lines.push(`Member Since: ${new Date(personal.created_at as string).toLocaleDateString()}`)
  lines.push(`Referral Code: ${personal.referral_code}`)
  lines.push('')
  
  // Fitness Stats
  const stats = (data.fitness_data as Record<string, unknown>).stats as Record<string, unknown>
  lines.push('=== FITNESS STATS ===')
  lines.push(`Current Streak: ${stats.current_streak} days`)
  lines.push(`Longest Streak: ${stats.longest_streak} days`)
  lines.push(`Weekly Goal: ${stats.weekly_goal} workouts`)
  lines.push('')
  
  // Memberships
  const memberships = data.memberships as Array<Record<string, unknown>>
  if (memberships && memberships.length > 0) {
    lines.push('=== MEMBERSHIP HISTORY ===')
    lines.push('Plan,Start Date,Expiry Date,Status')
    memberships.forEach(m => {
      lines.push(`${m.plan_type},${m.start_date},${m.expiry_date},${m.status}`)
    })
    lines.push('')
  }
  
  // Payments
  const payments = data.payments as Array<Record<string, unknown>>
  if (payments && payments.length > 0) {
    lines.push('=== PAYMENT HISTORY ===')
    lines.push('Date,Amount (KES),Plan,Status,M-Pesa Receipt')
    payments.forEach(p => {
      const date = new Date(p.created_at as string).toLocaleDateString()
      lines.push(`${date},${p.amount},${p.plan_type},${p.status},${p.mpesa_receipt || 'N/A'}`)
    })
    lines.push('')
  }
  
  // Workouts
  const workouts = (data.fitness_data as Record<string, unknown>).workouts as Array<Record<string, unknown>>
  if (workouts && workouts.length > 0) {
    lines.push('=== WORKOUT HISTORY ===')
    lines.push('Date,Name,Location,Duration (min),Exercises')
    workouts.forEach(w => {
      const date = new Date(w.date as string).toLocaleDateString()
      const exercises = (w.workout_exercises as Array<Record<string, string>>)?.map(e => e.exercise_name).join('; ') || ''
      lines.push(`${date},${w.name},${w.location},${w.duration_minutes || 'N/A'},"${exercises}"`)
    })
    lines.push('')
  }
  
  // Weight Progress
  const weights = (data.fitness_data as Record<string, unknown>).weights as Array<Record<string, unknown>>
  if (weights && weights.length > 0) {
    lines.push('=== WEIGHT PROGRESS ===')
    lines.push('Date,Weight (kg)')
    weights.forEach(w => {
      const date = new Date(w.recorded_at as string).toLocaleDateString()
      lines.push(`${date},${w.weight_kg}`)
    })
    lines.push('')
  }
  
  // Goals
  const goals = (data.fitness_data as Record<string, unknown>).goals as Array<Record<string, unknown>>
  if (goals && goals.length > 0) {
    lines.push('=== GOALS ===')
    lines.push('Title,Target,Current,Status')
    goals.forEach(g => {
      const status = g.completed ? 'Completed' : 'In Progress'
      lines.push(`${g.title},${g.target} ${g.unit},${g.current} ${g.unit},${status}`)
    })
    lines.push('')
  }
  
  // Check-ins
  const checkins = data.checkins as Array<Record<string, unknown>>
  if (checkins && checkins.length > 0) {
    lines.push('=== CHECK-IN HISTORY ===')
    lines.push('Date,Time,Location')
    checkins.forEach(c => {
      const datetime = new Date(c.checked_in_at as string)
      lines.push(`${datetime.toLocaleDateString()},${datetime.toLocaleTimeString()},${c.location}`)
    })
  }
  
  return lines.join('\n')
}