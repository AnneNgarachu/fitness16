'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ReferralCard from '@/components/profile/ReferralCard'
import DangerZone from '@/components/profile/DangerZone'

interface Member {
  id: string
  first_name: string
  last_name: string
  phone: string
  referral_code: string
  created_at: string
}

interface Membership {
  plan_type: string
  days_remaining: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    try {
      // API uses session internally - no member_id needed
      const profileRes = await fetch('/api/member/profile')
      
      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          router.push('/login')
          return
        }
        const errorData = await profileRes.json()
        throw new Error(errorData.error?.message || 'Failed to load profile')
      }
      
      const profileData = await profileRes.json()
      setMember(profileData.member)
      setMembership(profileData.membership)
    } catch (err) {
      console.error('Profile error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-zinc-800 px-4 py-4 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Profile</h1>
          <Link
            href="/plans"
            className="bg-linear-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
          >
            Upgrade
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4">
        {/* Profile Header */}
        <ProfileHeader
          firstName={member.first_name}
          lastName={member.last_name}
          phone={member.phone}
          memberSince={member.created_at}
          membership={membership}
        />

        {/* Referral Card */}
        <ReferralCard referralCode={member.referral_code} />

        {/* Quick Links */}
        <div className="bg-zinc-900 rounded-2xl p-5 mb-4">
          <h3 className="font-bold mb-4 text-zinc-400">Quick Links</h3>
          
          <Link
            href="/plans"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors mb-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💳</span>
              <span>Membership Plans</span>
            </div>
            <span className="text-zinc-500">→</span>
          </Link>

          <Link
            href="/payments"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors mb-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🧾</span>
              <span>Payment History</span>
            </div>
            <span className="text-zinc-500">→</span>
          </Link>

          <Link
            href="/progress"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors mb-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <span>Progress & Weight</span>
            </div>
            <span className="text-zinc-500">→</span>
          </Link>

          <Link
            href="/workouts"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors mb-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💪</span>
              <span>Workout History</span>
            </div>
            <span className="text-zinc-500">→</span>
          </Link>

          <Link
            href="/goals"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors mb-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <span>My Goals</span>
            </div>
            <span className="text-zinc-500">→</span>
          </Link>

          <Link
            href="/feedback"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <span>Share Feedback</span>
            </div>
            <span className="text-zinc-500">→</span>
          </Link>
        </div>

        {/* Danger Zone */}
        <DangerZone memberId={member.id} onLogout={handleLogout} />
      </main>

      <BottomNav />
    </div>
  )
}