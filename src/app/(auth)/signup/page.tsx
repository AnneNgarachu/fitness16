'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GYM } from '@/lib/constants'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    location: '',
    referralCode: '',
  })
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill phone from OTP verification
  useEffect(() => {
    const phone = searchParams.get('phone')
    if (phone) {
      setFormData(prev => ({ ...prev, phone }))
    }
  }, [searchParams])

  const handleSubmit = async () => {
    setError('')
    
    if (!formData.firstName || !formData.phone || !formData.location) {
      setError('Please fill in all required fields')
      return
    }
    
    if (!consents.terms || !consents.privacy) {
      setError('Please accept the Terms and Privacy Policy')
      return
    }
    
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || undefined,
          home_location: formData.location,
          referred_by_code: formData.referralCode || undefined,
          privacy_consent: consents.privacy,
          terms_consent: consents.terms,
          marketing_consent: consents.marketing,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Signup failed')
      }
      
      // Signup successful, now login
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const phoneFromParams = searchParams.get('phone')

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-black mb-2">Join Fitness 16</h1>
      <p className="text-zinc-500 mb-6">Start your fitness transformation today</p>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <Input
          label="First Name *"
          placeholder="John"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        />
        
        <Input
          label="Last Name"
          placeholder="Kamau"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        />
        
        <Input
          label="Phone Number *"
          type="tel"
          placeholder="254712345678"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          disabled={!!phoneFromParams}
        />
        
        <Input
          label="Email (Optional)"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        
        {/* Location Selection */}
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Select Your Home Gym *</label>
          <div className="grid grid-cols-2 gap-3">
            {GYM.locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setFormData({ ...formData, location: loc.id })}
                className={`p-4 rounded-xl text-center transition-all ${
                  formData.location === loc.id
                    ? 'bg-linear-to-r from-orange-500 to-pink-500 text-white'
                    : 'bg-zinc-900 border border-zinc-700 text-white hover:border-zinc-500'
                }`}
              >
                <div className="text-2xl mb-2">📍</div>
                <div className="font-semibold">{loc.name}</div>
              </button>
            ))}
          </div>
        </div>
        
        <Input
          label="Referral Code (Optional)"
          placeholder="FRIEND123"
          value={formData.referralCode}
          onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
        />
        
        {/* Consents */}
        <div className="space-y-3 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consents.privacy}
              onChange={(e) => setConsents({ ...consents, privacy: e.target.checked })}
              className="mt-1 w-5 h-5 rounded accent-orange-500"
            />
            <span className="text-sm text-zinc-400">
              I agree to the <span className="text-orange-500">Privacy Policy</span> and consent to my data being processed *
            </span>
          </label>
          
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consents.terms}
              onChange={(e) => setConsents({ ...consents, terms: e.target.checked })}
              className="mt-1 w-5 h-5 rounded accent-orange-500"
            />
            <span className="text-sm text-zinc-400">
              I agree to the <span className="text-orange-500">Terms of Service</span> *
            </span>
          </label>
          
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consents.marketing}
              onChange={(e) => setConsents({ ...consents, marketing: e.target.checked })}
              className="mt-1 w-5 h-5 rounded accent-orange-500"
            />
            <span className="text-sm text-zinc-400">
              I want to receive promotional offers and updates (optional)
            </span>
          </label>
        </div>
      </div>
      
      <Button
        className="w-full mt-8"
        onClick={handleSubmit}
        isLoading={isLoading}
      >
        Create Account
      </Button>
      
      <p className="text-center mt-6 text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="text-orange-500 font-semibold hover:underline">
          Log In
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-black text-white p-5 pb-10">
      <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
        ← Back
      </Link>
      
      <Suspense fallback={
        <div className="mt-6 flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  )
}