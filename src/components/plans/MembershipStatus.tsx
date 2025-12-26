'use client';

interface MembershipStatusProps {
  membership: {
    plan_type: string;
    status: string;
    expiry_date: string;
    days_remaining: number;
  } | null;
}

export function MembershipStatus({ membership }: MembershipStatusProps) {
  if (!membership) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
            <span className="text-xl">💪</span>
          </div>
          <div>
            <div className="text-zinc-400 text-xs">Membership Status</div>
            <div className="text-white font-bold">No active membership</div>
          </div>
        </div>
        <p className="text-zinc-500 text-sm mt-3">
          Select a plan below to start your fitness journey!
        </p>
      </div>
    );
  }

  const isExpiring = membership.days_remaining <= 7;
  const isExpired = membership.status === 'expired' || membership.days_remaining <= 0;

  const formatPlanName = (planType: string) => {
    const names: Record<string, string> = {
      day: 'Day Pass',
      week: 'Weekly',
      month: 'Monthly',
      quarterly: 'Quarterly',
      semi_annual: 'Semi-Annual',
      annual: 'Annual',
    };
    return names[planType] || planType;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`
      rounded-2xl p-4 mb-6 border
      ${isExpired 
        ? 'bg-red-500/10 border-red-500/30' 
        : isExpiring 
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-green-500/10 border-green-500/30'
      }
    `}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-zinc-400 text-xs">Current Membership</div>
          <div className="text-white font-bold text-lg">
            {formatPlanName(membership.plan_type)}
          </div>
        </div>
        <div className={`
          px-3 py-1 rounded-full text-xs font-bold
          ${isExpired 
            ? 'bg-red-500/20 text-red-400' 
            : isExpiring 
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-green-500/20 text-green-400'
          }
        `}>
          {isExpired ? '❌ Expired' : isExpiring ? '⚠️ Expiring Soon' : '✓ Active'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-zinc-400 text-[10px]">Expires</div>
          <div className="text-white font-semibold text-sm">
            {formatDate(membership.expiry_date)}
          </div>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-zinc-400 text-[10px]">Days Left</div>
          <div className={`font-bold text-lg ${
            isExpired ? 'text-red-400' : isExpiring ? 'text-yellow-400' : 'text-white'
          }`}>
            {membership.days_remaining > 0 ? membership.days_remaining : 0}
          </div>
        </div>
      </div>

      {isExpiring && !isExpired && (
        <p className="text-yellow-400/80 text-xs mt-3">
          ⚠️ Your membership expires soon. Renew now to keep your streak!
        </p>
      )}

      {isExpired && (
        <p className="text-red-400/80 text-xs mt-3">
          ❌ Your membership has expired. Renew to continue accessing the gym.
        </p>
      )}
    </div>
  );
}