'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
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
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.message || 'Failed to send OTP';
        throw new Error(errorMessage);
      }

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
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.message || 'Invalid OTP';
        throw new Error(errorMessage);
      }

      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-orange-500 to-pink-500 flex items-center justify-center font-black text-xl mx-auto mb-4">
            F16
          </div>
          <h1 className="text-2xl font-black text-white">Admin Login</h1>
          <p className="text-zinc-500 text-sm mt-1">Fitness 16 Dashboard</p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {step === 'phone' ? (
            <>
              <div className="mb-4">
                <label className="block text-zinc-400 text-xs mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSendOtp}
                disabled={phone.replace(/\D/g, '').length < 9 || isLoading}
                className="w-full py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-2">
                <label className="block text-zinc-400 text-xs mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-2xl text-center tracking-widest focus:outline-none focus:border-orange-500"
                />
              </div>

              <p className="text-zinc-500 text-xs text-center mb-4">
                OTP sent to {formatPhone(phone)}
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={otp.length < 4 || isLoading}
                className="w-full py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50 mb-3"
              >
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError(null);
                }}
                className="w-full py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800"
              >
                Change Number
              </button>
            </>
          )}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Staff access only. Contact admin for access.
        </p>
      </div>
    </div>
  );
}