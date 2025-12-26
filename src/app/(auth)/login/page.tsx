'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Convert local Kenyan format to international format
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return '254' + digits.slice(1)
  }
  if (digits.startsWith('+254')) {
    return digits.slice(1)
  }
  if (!digits.startsWith('254') && digits.length > 0) {
    return '254' + digits
  }
  return digits
}

// Validate Kenyan phone number
function isValidKenyanPhone(phone: string): boolean {
  const formatted = formatPhone(phone)
  // Must be 254 followed by 9 digits starting with 1 or 7
  return /^254[17]\d{8}$/.test(formatted)
}

// Format for display (user-friendly)
function formatPhoneDisplay(phone: string): string {
  const formatted = formatPhone(phone)
  if (formatted.length === 12) {
    return `+${formatted.slice(0, 3)} ${formatted.slice(3, 6)} ${formatted.slice(6, 9)} ${formatted.slice(9)}`
  }
  return formatted
}

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async () => {
    setError('')
    
    // Validate phone before sending
    if (!phone.trim()) {
      setError('Please enter your phone number')
      return
    }
    
    if (!isValidKenyanPhone(phone)) {
      setError('Invalid phone number. Examples: 0712345678, 0112345678')
      return
    }
    
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhone(phone) }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to send OTP')
      }
      
      setOtpSent(true)
      
      // Auto-fill OTP in dev mode
      if (data.dev_otp) {
        setOtp(data.dev_otp)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError('')
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhone(phone), code: otp }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Invalid OTP')
      }
      
      if (data.isNewUser) {
        router.push(`/signup?phone=${formatPhone(phone)}`)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-5">
      <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
        ← Back
      </Link>
      
      <div className="mt-8">
        <h1 className="text-3xl font-black mb-2">Welcome Back!</h1>
        <p className="text-zinc-500 mb-8">Log in with your phone number</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}
        
        {!otpSent ? (
          <>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="0712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-zinc-600 text-xs mt-2 mb-4">
              Enter in any format: 0712..., +254712..., or 254712...
            </p>
            
            <Button
              className="w-full"
              onClick={handleSendOtp}
              isLoading={isLoading}
              disabled={phone.replace(/\D/g, '').length < 9}
            >
              Send OTP
            </Button>
          </>
        ) : (
          <>
            <div className="bg-zinc-900 rounded-xl p-4 mb-6">
              <p className="text-sm text-zinc-500">OTP sent to</p>
              <p className="font-semibold">{formatPhoneDisplay(phone)}</p>
            </div>
            
            <Input
              label="Enter 6-digit OTP"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
            
            <Button
              className="w-full mt-6"
              onClick={handleVerifyOtp}
              isLoading={isLoading}
              disabled={otp.length !== 6}
            >
              Verify & Login
            </Button>
            
            <button
              onClick={() => {
                setOtpSent(false)
                setOtp('')
                setError('')
              }}
              className="w-full mt-4 text-zinc-500 hover:text-white transition-colors"
            >
              ← Change number or resend OTP
            </button>
          </>
        )}
        
        <p className="text-center mt-8 text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-orange-500 font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}