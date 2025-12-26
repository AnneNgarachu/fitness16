'use client';

import { useState, useEffect } from 'react';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  membership_status: string;
  days_remaining: number | null;
  plan_type?: string;
  expiry_date?: string;
}

interface CheckInCardProps {
  member: Member;
  location: string;
  onCheckIn: () => void;
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

export function CheckInCard({ member, location, onCheckIn, onCancel }: CheckInCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRenewal, setShowRenewal] = useState(false);
  const [showNextPlan, setShowNextPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('month');
  const [renewalSuccess, setRenewalSuccess] = useState(false);
  const [queuedPlan, setQueuedPlan] = useState<string | null>(null);
  const [queuedPlanPaid, setQueuedPlanPaid] = useState(false);

  // Fetch queued plan info on mount
  useEffect(() => {
    const fetchQueuedPlan = async () => {
      try {
        const res = await fetch(`/api/memberships/queue-plan?member_id=${member.id}`);
        if (res.ok) {
          const data = await res.json();
          setQueuedPlan(data.queued_plan);
          setQueuedPlanPaid(data.queued_plan_paid);
        }
      } catch (err) {
        console.error('Failed to fetch queued plan:', err);
      }
    };
    fetchQueuedPlan();
  }, [member.id]);

  const handleCheckIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reception/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.id,
          location,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Check-in failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onCheckIn();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenewal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const phone = normalizePhone(member.phone);

      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.id,
          phone,
          plan_type: selectedPlan,
          is_walkin: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to initiate payment');
      }

      setRenewalSuccess(true);
      setTimeout(() => {
        onCheckIn();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueueNextPlan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const phone = normalizePhone(member.phone);

      const res = await fetch('/api/memberships/queue-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.id,
          phone,
          plan_type: selectedPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to queue plan');
      }

      setRenewalSuccess(true);
      setTimeout(() => {
        onCheckIn();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue plan');
    } finally {
      setIsLoading(false);
    }
  };

  const normalizePhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) return cleaned;
    if (cleaned.startsWith('0')) return '254' + cleaned.slice(1);
    return '254' + cleaned;
  };

  const formatPlanType = (planType: string | undefined) => {
    if (!planType) return 'Unknown';
    const labels: Record<string, string> = {
      day: 'Day Pass',
      week: 'Weekly',
      month: 'Monthly',
      quarterly: 'Quarterly',
      semi_annual: '6 Months',
      annual: 'Annual',
    };
    return labels[planType] || planType;
  };

  const isExpired = member.membership_status === 'expired';
  const isExpiring = member.membership_status === 'expiring';
  const isActive = member.membership_status === 'active';
  const plan = PLANS.find(p => p.id === selectedPlan);

  // Success state - checked in
  if (success) {
    return (
      <div className="bg-green-500/10 border-2 border-green-500 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-400 mb-2">Checked In!</h3>
        <p className="text-zinc-400">
          {member.first_name} {member.last_name}
        </p>
      </div>
    );
  }

  // Success state - renewal/next plan initiated
  if (renewalSuccess) {
    return (
      <div className="bg-green-500/10 border-2 border-green-500 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">📱</div>
        <h3 className="text-2xl font-bold text-green-400 mb-2">M-Pesa Sent!</h3>
        <p className="text-zinc-400 mb-2">
          Payment request sent to {member.phone}
        </p>
        {showNextPlan && (
          <p className="text-zinc-500 text-sm">
            {formatPlanType(selectedPlan)} will start after current plan expires
          </p>
        )}
      </div>
    );
  }

  // Renewal flow (for expired members)
  if (showRenewal) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">Renew Membership</h3>
        
        {/* Member Info */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-xl">
            {member.first_name[0]}
          </div>
          <div>
            <div className="font-bold text-white">{member.first_name} {member.last_name}</div>
            <div className="text-zinc-500 text-sm">{member.phone}</div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`p-3 rounded-xl text-center transition-colors ${
                selectedPlan === p.id
                  ? 'bg-orange-500/20 border-2 border-orange-500'
                  : 'bg-zinc-800 border border-zinc-700'
              }`}
            >
              <div className="font-medium text-sm">{p.name}</div>
              <div className="font-bold">KES {p.price.toLocaleString()}</div>
            </button>
          ))}
        </div>

        {/* Total */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-4 flex justify-between items-center">
          <span className="text-zinc-400">Total</span>
          <span className="text-xl font-black text-orange-400">
            KES {plan?.price.toLocaleString()}
          </span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowRenewal(false)}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleRenewal}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send M-Pesa Prompt'}
          </button>
        </div>
      </div>
    );
  }

  // Next Plan flow (for active/expiring members)
  if (showNextPlan) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">Queue Next Plan</h3>
        
        {/* Member Info */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-xl">
            {member.first_name[0]}
          </div>
          <div>
            <div className="font-bold text-white">{member.first_name} {member.last_name}</div>
            <div className="text-zinc-500 text-sm">
              Current: {formatPlanType(member.plan_type)} • Expires: {member.expiry_date || `${member.days_remaining} days`}
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4 text-sm text-blue-400">
          💡 New plan starts automatically after current plan expires. Pay now, activate later!
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`p-3 rounded-xl text-center transition-colors ${
                selectedPlan === p.id
                  ? 'bg-orange-500/20 border-2 border-orange-500'
                  : 'bg-zinc-800 border border-zinc-700'
              }`}
            >
              <div className="font-medium text-sm">{p.name}</div>
              <div className="font-bold">KES {p.price.toLocaleString()}</div>
            </button>
          ))}
        </div>

        {/* Total */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-4 flex justify-between items-center">
          <span className="text-zinc-400">Total (Pay Now)</span>
          <span className="text-xl font-black text-orange-400">
            KES {plan?.price.toLocaleString()}
          </span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowNextPlan(false)}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleQueueNextPlan}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Pay & Queue Plan'}
          </button>
        </div>
      </div>
    );
  }

  // Main check-in view
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      {/* Member Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-2xl">
          {member.first_name[0]}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">
            {member.first_name} {member.last_name}
          </h3>
          <p className="text-zinc-500">{member.phone}</p>
          {member.plan_type && (
            <p className="text-zinc-600 text-sm">{formatPlanType(member.plan_type)}</p>
          )}
        </div>
      </div>

      {/* Membership Status */}
      <div className={`rounded-xl p-4 mb-4 ${
        isExpired 
          ? 'bg-red-500/10 border border-red-500/30' 
          : isExpiring 
          ? 'bg-yellow-500/10 border border-yellow-500/30'
          : 'bg-green-500/10 border border-green-500/30'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <div className={`font-bold ${
              isExpired ? 'text-red-400' : isExpiring ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {isExpired ? '❌ Membership Expired' : isExpiring ? '⚠️ Expiring Soon' : '✓ Active Membership'}
            </div>
            {member.days_remaining !== null && (
              <div className="text-zinc-400 text-sm mt-1">
                {member.days_remaining > 0 
                  ? `${member.days_remaining} days remaining`
                  : 'Please renew membership'
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queued Plan Info */}
      {queuedPlan && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-400 font-bold text-sm">📅 Next Plan Queued</div>
              <div className="text-zinc-400 text-sm">
                {formatPlanType(queuedPlan)} • {queuedPlanPaid ? '✓ Paid' : '⏳ Pending payment'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      {isExpired ? (
        <div className="space-y-3">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            ⚠️ Cannot check in - membership has expired
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowRenewal(true)}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500"
            >
              💳 Renew Now
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckIn}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
            >
              {isLoading ? 'Checking in...' : '✓ Check In'}
            </button>
          </div>
          
          {/* Next plan option for active/expiring members */}
          {(isActive || isExpiring) && !queuedPlan && (
            <button
              onClick={() => setShowNextPlan(true)}
              className="w-full py-3 rounded-xl font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
            >
              📅 Queue Next Plan (Upgrade/Renew Early)
            </button>
          )}
          
          {/* Renew option for expiring members */}
          {isExpiring && (
            <button
              onClick={() => setShowRenewal(true)}
              className="w-full py-3 rounded-xl font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-colors"
            >
              💳 Renew Immediately
            </button>
          )}
        </div>
      )}
    </div>
  );
}