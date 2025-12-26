'use client';

import { useState } from 'react';

interface WalkInFormProps {
  location: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PLANS = [
  { id: 'day', name: 'Day Pass', price: 500 },
  { id: 'week', name: 'Weekly', price: 2000 },
  { id: 'month', name: 'Monthly', price: 5500 },
];

export function WalkInForm({ location, onSuccess, onCancel }: WalkInFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [planType, setPlanType] = useState('day');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('0')
        ? cleanPhone
        : `0${cleanPhone}`;

      const res = await fetch('/api/reception/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: formattedPhone,
          location,
          plan_type: planType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register walk-in');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = PLANS.find(p => p.id === planType);

  if (success) {
    return (
      <div className="bg-green-500/10 border-2 border-green-500 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-400 mb-2">Walk-in Registered!</h3>
        <p className="text-zinc-400">M-Pesa prompt sent to customer</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">Register Walk-in</h3>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-zinc-400 text-xs mb-2">Customer Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-zinc-400 text-xs mb-2">Phone Number</label>
          <input
            type="tel"
            value={formatPhone(phone)}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712 345 678"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Plan Selection */}
        <div>
          <label className="block text-zinc-400 text-xs mb-2">Select Plan</label>
          <div className="space-y-2">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setPlanType(plan.id)}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-colors ${
                  planType === plan.id
                    ? 'bg-orange-500/20 border-2 border-orange-500'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                <span className="font-medium">{plan.name}</span>
                <span className="font-bold">KES {plan.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
          <span className="text-zinc-400">Total</span>
          <span className="text-2xl font-black text-white">
            KES {selectedPlan?.price.toLocaleString()}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || phone.replace(/\D/g, '').length < 9 || isLoading}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Send M-Pesa Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}