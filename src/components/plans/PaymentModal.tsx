'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Plan } from './PlanCard';

type PaymentStatus = 'idle' | 'sending' | 'waiting' | 'polling' | 'success' | 'failed';

interface PaymentModalProps {
  plan: Plan;
  phone: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ plan, phone, onClose, onSuccess }: PaymentModalProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  const formatPhoneDisplay = (p: string) => {
    if (p.startsWith('254')) {
      return '0' + p.slice(3);
    }
    return p;
  };

  const formatPhoneAPI = (p: string) => {
    const cleaned = p.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.slice(1);
    }
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return '254' + cleaned;
    }
    return cleaned;
  };

  const isValidPhone = (p: string) => {
    const formatted = formatPhoneAPI(p);
    return /^254[17]\d{8}$/.test(formatted);
  };

  const pollStatus = useCallback(async (requestId: string) => {
    try {
      const res = await fetch(`/api/payments/status?checkout_request_id=${requestId}`);
      const data = await res.json();

      if (data.success) {
        if (data.status === 'completed') {
          setStatus('success');
          setTimeout(onSuccess, 1500);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setError(data.failure_reason || 'Payment was not completed');
        }
      }
    } catch {
      console.error('Failed to check status');
    }
  }, [onSuccess]);

  useEffect(() => {
    if (status !== 'polling' || !checkoutRequestId) return;

    const interval = setInterval(() => {
      pollStatus(checkoutRequestId);
    }, 3000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (status === 'polling') {
        setStatus('failed');
        setError('Payment timed out. Please try again.');
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, checkoutRequestId, pollStatus]);

  useEffect(() => {
    if (status !== 'waiting' && status !== 'polling') return;

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const initiatePayment = async () => {
    if (!isValidPhone(phoneNumber)) {
      setError('Please enter a valid Kenyan phone number');
      return;
    }

    setError(null);
    setStatus('sending');

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: plan.plan_type,
          phone: formatPhoneAPI(phoneNumber),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to initiate payment');
      }

      if (data.success) {
        setCheckoutRequestId(data.checkout_request_id);
        setStatus('waiting');
        setCountdown(60);
        setTimeout(() => setStatus('polling'), 5000);
      } else {
        throw new Error(data.error || 'Failed to initiate payment');
      }
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setError(null);
    setCheckoutRequestId(null);
    setCountdown(60);
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md max-h-[85vh] overflow-auto">
        <div className="sticky top-0 bg-zinc-900 px-5 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-extrabold text-lg text-white">
            {status === 'success' ? '✅ Payment Successful' : 'Pay with M-Pesa'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <div className="p-5">
          <div className="bg-zinc-800 rounded-xl p-4 mb-5">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-zinc-400 text-xs">Plan</div>
                <div className="font-bold text-white">{plan.name}</div>
              </div>
              <div className="text-right">
                <div className="text-zinc-400 text-xs">Amount</div>
                <div className="font-extrabold text-xl text-white">
                  KES {plan.price.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {status === 'idle' && (
            <>
              <div className="mb-5">
                <label className="block text-zinc-400 text-xs mb-2">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={formatPhoneDisplay(phoneNumber)}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0712 345 678"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-lg focus:outline-none focus:border-orange-500"
                />
                <p className="text-zinc-500 text-xs mt-2">
                  You&apos;ll receive an M-Pesa prompt on this number
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={initiatePayment}
                disabled={!phoneNumber}
                className="w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
              >
                Send M-Pesa Prompt
              </button>
            </>
          )}

          {status === 'sending' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-white font-bold mb-2">Sending payment request...</div>
              <div className="text-zinc-400 text-sm">Please wait</div>
            </div>
          )}

          {(status === 'waiting' || status === 'polling') && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">📱</div>
              <div className="text-white font-bold text-lg mb-2">Check your phone</div>
              <div className="text-zinc-400 text-sm mb-4">
                Enter your M-Pesa PIN on <strong>{formatPhoneDisplay(phoneNumber)}</strong>
              </div>

              <div className="bg-zinc-800 rounded-xl p-4 mb-5">
                <div className="text-zinc-400 text-xs mb-1">Time remaining</div>
                <div className="text-2xl font-bold text-white">
                  {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Waiting for confirmation...
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <div className="text-white font-bold text-xl mb-2">Payment Successful!</div>
              <div className="text-zinc-400 text-sm mb-4">
                Your {plan.name} membership is now active
              </div>
              <div className="text-green-400 text-sm">Redirecting to dashboard...</div>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">😔</div>
              <div className="text-white font-bold text-lg mb-2">Payment Failed</div>
              <div className="text-zinc-400 text-sm mb-4">{error}</div>

              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-center gap-2">
              <span className="text-green-500 text-lg">🔒</span>
              <span className="text-zinc-500 text-xs">Secured by M-Pesa</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}