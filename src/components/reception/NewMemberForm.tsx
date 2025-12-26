'use client';

import { useState } from 'react';

interface NewMemberFormProps {
  location: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PLANS = [
  { id: 'day', name: 'Day Pass', price: 500 },
  { id: 'week', name: 'Weekly', price: 2000 },
  { id: 'month', name: 'Monthly', price: 5500 },
  { id: 'quarterly', name: 'Quarterly', price: 15000 },
  { id: 'semi_annual', name: '6 Months', price: 30000 },
  { id: 'annual', name: 'Annual', price: 54000 },
];

export function NewMemberForm({ location, onSuccess, onCancel }: NewMemberFormProps) {
  const [step, setStep] = useState<'details' | 'plan' | 'confirm'>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [homeLocation, setHomeLocation] = useState(location);
  const [planType, setPlanType] = useState('month');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  };

  const normalizePhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) return cleaned;
    if (cleaned.startsWith('0')) return '254' + cleaned.slice(1);
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) return '254' + cleaned;
    return cleaned;
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhone(phone);

      // Step 1: Create member account
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          first_name: firstName,
          last_name: lastName,
          home_location: homeLocation,
          privacy_consent: true,
          terms_consent: true,
          marketing_consent: false,
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        throw new Error(signupData.error?.message || 'Failed to create account');
      }

      const memberId = signupData.member.id;

      // Step 2: Initiate M-Pesa payment
      const paymentRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          phone: normalizedPhone,
          plan_type: planType,
          is_walkin: false,
        }),
      });

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        throw new Error(paymentData.error?.message || 'Failed to initiate payment');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = PLANS.find(p => p.id === planType);
  const isPhoneValid = normalizePhone(phone).length === 12;

  if (success) {
    return (
      <div className="bg-green-500/10 border-2 border-green-500 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-green-400 mb-2">Member Registered!</h3>
        <p className="text-zinc-400 mb-2">Account created for {firstName} {lastName}</p>
        <p className="text-zinc-500 text-sm">M-Pesa prompt sent to their phone</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">New Member Registration</h3>
        <div className="flex gap-1">
          {['details', 'plan', 'confirm'].map((s, i) => (
            <div
              key={s}
              className={`w-8 h-1 rounded-full ${
                i <= ['details', 'plan', 'confirm'].indexOf(step)
                  ? 'bg-orange-500'
                  : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Personal Details */}
      {step === 'details' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-xs mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs mb-2">Phone Number (M-Pesa)</label>
            <input
              type="tel"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712 345 678"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs mb-2">Home Location</label>
            <div className="flex gap-3">
              {['juja', 'ruaka'].map((loc) => (
                <button
                  key={loc}
                  onClick={() => setHomeLocation(loc)}
                  className={`flex-1 py-3 rounded-xl font-semibold capitalize transition-colors ${
                    homeLocation === loc
                      ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-400'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('plan')}
              disabled={!firstName || !lastName || !isPhoneValid}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
            >
              Next: Select Plan
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Plan Selection */}
      {step === 'plan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setPlanType(plan.id)}
                className={`flex flex-col items-center p-4 rounded-xl transition-colors ${
                  planType === plan.id
                    ? 'bg-orange-500/20 border-2 border-orange-500'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                <span className="font-medium text-sm">{plan.name}</span>
                <span className="font-bold text-lg mt-1">KES {plan.price.toLocaleString()}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep('details')}
              className="flex-1 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500"
            >
              Next: Confirm
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Name</span>
              <span className="font-medium">{firstName} {lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Phone</span>
              <span className="font-medium">{formatPhone(phone)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Home Location</span>
              <span className="font-medium capitalize">{homeLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Plan</span>
              <span className="font-medium">{selectedPlan?.name}</span>
            </div>
            <div className="border-t border-zinc-700 pt-3 flex justify-between">
              <span className="text-zinc-400">Total</span>
              <span className="text-xl font-black text-orange-400">
                KES {selectedPlan?.price.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-400">
            💡 M-Pesa prompt will be sent to {formatPhone(phone)}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('plan')}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Register & Send Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}