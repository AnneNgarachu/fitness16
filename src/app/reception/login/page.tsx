/**
 * Reception Login Page - Split Screen Design
 * Location: src/app/reception/login/page.tsx
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ReceptionLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  };

  const handleSendOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('0')
        ? `254${cleanPhone.slice(1)}`
        : cleanPhone.startsWith('254')
        ? cleanPhone
        : `254${cleanPhone}`;

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, userType: 'staff' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : data.message || 'Failed to send OTP');
      }

      if (data.dev_otp) setOtp(data.dev_otp);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('0')
        ? `254${cleanPhone.slice(1)}`
        : cleanPhone.startsWith('254')
        ? cleanPhone
        : `254${cleanPhone}`;

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, code: otp, userType: 'staff' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : data.message || 'Invalid OTP');
      }

      router.push('/reception');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-700 relative overflow-hidden">
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
            width={120}
            height={120}
            className="rounded-3xl shadow-2xl mb-8"
          />
          <h1 className="text-5xl font-black text-white mb-4">Fitness 16</h1>
          <p className="text-xl text-white/80 mb-8">Reception Check-in System</p>
          
          <div className="space-y-4 text-left max-w-sm">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-3xl">✅</span>
              <div>
                <div className="font-semibold text-white">Quick Check-ins</div>
                <div className="text-sm text-white/70">Fast member verification</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-3xl">🚶</span>
              <div>
                <div className="font-semibold text-white">Walk-in Registration</div>
                <div className="text-sm text-white/70">Add new visitors easily</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="text-3xl">🎯</span>
              <div>
                <div className="font-semibold text-white">Lead Tracking</div>
                <div className="text-sm text-white/70">Convert visitors to members</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/logo.png"
              alt="Fitness 16"
              width={80}
              height={80}
              className="mx-auto mb-4 rounded-2xl"
            />
            <h1 className="text-2xl font-black">Reception Login</h1>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Reception Portal</h2>
            <p className="text-zinc-500">Sign in to manage check-ins</p>
          </div>

          {/* Form Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
            {step === 'phone' ? (
              <>
                <div className="mb-6">
                  <label className="block text-zinc-400 text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🇰🇪</span>
                    <input
                      type="tel"
                      value={formatPhone(phone)}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={phone.replace(/\D/g, '').length < 9 || isLoading}
                  className="w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                <div className="mb-4">
                  <label className="block text-zinc-400 text-sm font-medium mb-2">
                    Enter OTP Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-3xl text-center tracking-[0.5em] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <p className="text-zinc-500 text-sm text-center mb-6">
                  Code sent to <span className="text-white">{formatPhone(phone)}</span>
                </p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 4 || isLoading}
                  className="w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-4"
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
                  onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
                  className="w-full py-3 rounded-xl font-semibold text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  ← Change Number
                </button>
              </>
            )}
          </div>

          <p className="text-center text-zinc-600 text-sm mt-6">
            🔒 Reception staff only
          </p>
        </div>
      </div>
    </div>
  );
}