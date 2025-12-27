'use client'

import { useState } from 'react'

interface ProfileHeaderProps {
  firstName: string
  lastName: string
  phone: string
  email?: string
  memberSince: string
  membership: {
    plan_type: string
    days_remaining: number
    expiry_date?: string
  } | null
  onProfileUpdate?: () => void
}

export default function ProfileHeader({
  firstName,
  lastName,
  phone,
  email,
  memberSince,
  membership,
  onProfileUpdate,
}: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editFirstName, setEditFirstName] = useState(firstName)
  const [editLastName, setEditLastName] = useState(lastName)
  const [editEmail, setEditEmail] = useState(email || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  
  const getDaysColor = (days: number) => {
    if (days <= 3) return 'text-red-500'
    if (days <= 7) return 'text-orange-500'
    return 'text-green-500'
  }

  const handleEdit = () => {
    setEditFirstName(firstName)
    setEditLastName(lastName)
    setEditEmail(email || '')
    setError('')
    setSuccess(false)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      setError('First name and last name are required')
      return
    }

    if (editEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const res = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          email: editEmail.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to update profile')
      }

      setSuccess(true)
      setTimeout(() => {
        setIsEditing(false)
        setSuccess(false)
        if (onProfileUpdate) onProfileUpdate()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="bg-zinc-900 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-orange-500 to-pink-500 flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{firstName} {lastName}</h2>
            <p className="text-zinc-500 text-sm">{formatPhone(phone)}</p>
            {email && <p className="text-zinc-600 text-xs">{email}</p>}
          </div>
          {/* More obvious Edit button */}
          <button
            onClick={handleEdit}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        </div>

        {membership ? (
          <div className="bg-zinc-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-zinc-500">Membership</p>
                <p className="font-semibold capitalize">{membership.plan_type}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Days Left</p>
                <p className={`font-semibold ${getDaysColor(membership.days_remaining)}`}>
                  {membership.days_remaining}
                </p>
              </div>
            </div>
            {membership.expiry_date && (
              <div className="border-t border-zinc-700 pt-2 mt-2">
                <p className="text-xs text-zinc-500 text-center">
                  Expires on {formatExpiryDate(membership.expiry_date)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-3">
            <div>
              <p className="text-xs text-zinc-500">Membership</p>
              <p className="font-semibold">No active plan</p>
            </div>
            <span className="text-orange-500 text-sm font-medium">Upgrade →</span>
          </div>
        )}

        <p className="text-xs text-zinc-600 text-center mt-3">
          Member since {formatDate(memberSince)}
        </p>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-zinc-500 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-xl mb-4 text-sm">
                ✓ Profile updated successfully!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">First Name *</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={formatPhone(phone)}
                  disabled
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
                />
                <p className="text-xs text-zinc-600 mt-1">Phone number cannot be changed</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-linear-to-r from-orange-500 to-pink-500 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function formatPhone(phone: string): string {
  if (phone.length === 12 && phone.startsWith('254')) {
    return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`
  }
  return phone
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatExpiryDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}