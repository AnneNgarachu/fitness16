/**
 * Member Login Page - Split Screen Design
 * Location: src/app/(auth)/login/page.tsx
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('0')) return '254' + digits.slice(1);
    if (digits.startsWith('+254')) return digits.slice(1);
    if (!digits.startsWith('254') && digits.length > 0) return '254' + digits;
    return digits;
  };

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  };

  const isValidKenyanPhone = (phone: string): boolean => {
    const formatted = formatPhone(phone);
    return /^254[17]\d{8}$/.test(formatted);
  };

  const handleSendOtp = async () => {
    setError('');
    
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    
    if (!isValidKenyanPhone(phone)) {
      setError('Invalid phone number. Examples: 0712345678, 0112345678');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhone(phone) }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to send OTP');
      }
      
      setOtpSent(true);
      if (data.dev_otp) setOtp(data.dev_otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhone(phone), code: otp }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Invalid OTP');
      }
      
      if (data.isNewUser) {
        router.push(`/signup?phone=${formatPhone(phone)}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-orange-500 via-red-500 to-pink-600 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-black/20 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
          <Image
            src="/logo.png"
            alt="Fitness 16"
            width={140}
            height={140}
            className="rounded-3xl shadow-2xl mb-8"
          />
          <h1 className="text-5xl font-black text-white mb-4">Fitness 16</h1>
          <p className="text-2xl text-white/90 font-semibold mb-2">No Excuses. Just Work.</p>
          <p className="text-lg text-white/70 mb-12">Your fitness journey continues here</p>
          
          <div className="space-y-4 text-left max-w-sm">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-3xl">🔥</span>
              <div>
                <div className="font-semibold text-white">Stay Consistent</div>
                <div className="text-sm text-white/70">Every workout counts</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-3xl">💪</span>
              <div>
                <div className="font-semibold text-white">Push Your Limits</div>
                <div className="text-sm text-white/70">Get stronger every day</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-3xl">🏆</span>
              <div>
                <div className="font-semibold text-white">Achieve Your Goals</div>
                <div className="text-sm text-white/70">We&apos;re here to help</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back button */}
          <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-white transition-colors mb-8">
            ← Back to home
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/logo.png"
              alt="Fitness 16"
              width={80}
              height={80}
              className="mx-auto mb-4 rounded-2xl"
            />
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Welcome Back! 💪</h2>
            <p className="text-zinc-500">Sign in to track your fitness journey</p>
          </div>

          {/* Form Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
            {!otpSent ? (
              <>
                <div className="mb-6">
                  <label className="block text-zinc-400 text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🇰🇪</span>
                    <input
                      type="tel"
                      value={formatPhoneDisplay(phone)}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                  <p className="text-zinc-600 text-xs mt-2">
                    Enter: 0712..., +254712..., or 254712...
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={phone.replace(/\D/g, '').length < 9 || isLoading}
                  className="w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-zinc-500">OTP sent to</p>
                  <p className="font-semibold text-white">{formatPhoneDisplay(phone)}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-zinc-400 text-sm font-medium mb-2">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-3xl text-center tracking-[0.5em] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || isLoading}
                  className="w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-4"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Login'
                  )}
                </button>

                <button
                  onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                  className="w-full py-3 rounded-xl font-semibold text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  ← Change number or resend
                </button>
              </>
            )}
          </div>

          <p className="text-center mt-8 text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-orange-500 font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}