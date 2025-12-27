'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'

interface Member {
  id: string
  first_name: string
  last_name: string
  referral_code: string
  current_streak: number
  longest_streak: number
  weekly_goal: number
}

interface Membership {
  plan_type: string
  expiry_date: string
  days_remaining: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me')
      if (!meRes.ok) {
        router.push('/login')
        return
      }
      const meData = await meRes.json()
      
      const profileRes = await fetch(`/api/member/profile?member_id=${meData.user.id}`)
      const profileData = await profileRes.json()
      
      setMember(profileData.member)
      setMembership(profileData.membership)
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const handleCopyReferral = () => {
    if (member?.referral_code) {
      navigator.clipboard.writeText(member.referral_code)
    }
  }

  const today = new Date()
  const dateString = today.toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const weekProgress = member ? (member.current_streak / member.weekly_goal) * 100 : 0

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="p-5 flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm">{dateString}</p>
          <h1 className="text-2xl font-black">Hi, {member?.first_name} 👋</h1>
        </div>
        <button onClick={handleLogout} className="text-zinc-500 hover:text-white transition-colors">
          Logout
        </button>
      </div>

      <div className="px-5 mb-6">
        <div className="bg-linear-to-br from-orange-500 to-pink-500 rounded-2xl p-5">
          {membership ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white/80 text-sm">Current Plan</p>
                  <p className="text-xl font-bold capitalize">{membership.plan_type}</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm">Active</div>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <p className="text-white/80">Expires</p>
                  <p className="font-semibold">{membership.expiry_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80">Days Left</p>
                  <p className="font-semibold">{membership.days_remaining}</p>
                </div>
              </div>
              {membership.days_remaining <= 7 ? (
                <Link href="/plans" className="block w-full bg-white text-orange-500 text-center py-2 rounded-xl font-bold transition-colors">
                  ⚠️ Renew Now
                </Link>
              ) : membership.days_remaining <= 14 ? (
                <Link href="/plans" className="block w-full bg-white/20 hover:bg-white/30 text-center py-2 rounded-xl font-bold transition-colors">
                  Renew Membership
                </Link>
              ) : null}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-white/80 mb-2">No active membership</p>
              <Link href="/plans" className="inline-block bg-white text-orange-500 px-6 py-2 rounded-xl font-bold">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mb-6">
        <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/workouts/new" className="bg-zinc-900 rounded-xl p-4 text-center hover:bg-zinc-800 transition-colors">
            <div className="text-3xl mb-2">💪</div>
            <p className="font-semibold text-sm">Log Workout</p>
          </Link>
          <Link href="/goals" className="bg-zinc-900 rounded-xl p-4 text-center hover:bg-zinc-800 transition-colors">
            <div className="text-3xl mb-2">🎯</div>
            <p className="font-semibold text-sm">My Goals</p>
          </Link>
          <Link href="/progress" className="bg-zinc-900 rounded-xl p-4 text-center hover:bg-zinc-800 transition-colors">
            <div className="text-3xl mb-2">⚖️</div>
            <p className="font-semibold text-sm">Log Weight</p>
          </Link>
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="bg-zinc-900 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">This Week</h2>
            <span className="text-zinc-500">{member?.current_streak || 0}/{member?.weekly_goal || 3} workouts</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-orange-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, weekProgress)}%` }}
            />
          </div>
          <div className="flex justify-between mt-4 text-center">
            <div>
              <p className="text-2xl font-bold">{member?.longest_streak || 0}</p>
              <p className="text-zinc-500 text-sm">Week Streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold">🔥</p>
              <p className="text-zinc-500 text-sm">On Fire!</p>
            </div>
          </div>
        </div>
      </div>

      {member?.referral_code && (
        <div className="px-5">
          <div className="bg-zinc-900 rounded-2xl p-5">
            <h2 className="font-bold text-lg mb-2">Refer a Friend</h2>
            <p className="text-zinc-500 text-sm mb-4">
              Share your code and get rewards when friends join!
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 font-mono text-lg">
                {member.referral_code}
              </div>
              <button
                onClick={handleCopyReferral}
                className="bg-orange-500 hover:bg-orange-600 px-4 py-3 rounded-xl font-bold transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}