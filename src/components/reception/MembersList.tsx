'use client';

interface MemberListItem {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  days_remaining: number | null;
  plan_type: string | null;
  expiry_date: string | null;
  next_plan_type: string | null;
}

interface Props {
  members: MemberListItem[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  onSelectMember: (member: MemberListItem) => void;
  locationName: string;
}

export function MembersList({ members, loading, search, onSearchChange, onSelectMember, locationName }: Props) {
  const formatPlanType = (pt: string | null) => {
    if (!pt) return null;
    const labels: Record<string, string> = {
      day: 'Day Pass', week: 'Weekly', month: 'Monthly',
      quarterly: 'Quarterly', semi_annual: '6 Months', annual: 'Annual',
    };
    return labels[pt] || pt;
  };

  const formatExpiry = (status: string, days: number | null, date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    if (status === 'expired' && days !== null) {
      return { primary: `Expired ${Math.abs(days)} days ago`, secondary: `Ended ${formatted}`, color: 'text-red-400' };
    }
    if (days !== null && days > 0) {
      return { primary: `${days} days left`, secondary: `Due ${formatted}`, color: days <= 7 ? 'text-orange-400' : 'text-green-400' };
    }
    return null;
  };

  const getStatusBadge = (status: string, days: number | null) => {
    if (status === 'active' && days && days > 7) return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Active</span>;
    if (status === 'active' || status === 'expiring') return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400">Expiring</span>;
    if (status === 'expired') return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">Expired</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-zinc-500/20 text-zinc-400">No Plan</span>;
  };

  const filtered = members.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return m.first_name.toLowerCase().includes(s) || m.last_name.toLowerCase().includes(s) || m.phone.includes(search);
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Members at {locationName}</h2>
        <span className="text-zinc-500 text-sm">{members.length} total</span>
      </div>

      <input
        type="text"
        placeholder="Search by name or phone..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full mb-4 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
      />

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4 text-sm text-blue-400">
        💡 Tap a member to check in, renew, or upgrade
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">{search ? 'No matches' : 'No members'}</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filtered.map((m) => {
              const exp = formatExpiry(m.status, m.days_remaining, m.expiry_date);
              return (
                <button key={m.id} onClick={() => onSelectMember(m)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold">{m.first_name[0]}</div>
                    <div>
                      <div className="font-semibold">{m.first_name} {m.last_name}</div>
                      <div className="text-sm text-zinc-500">{m.phone}</div>
                      {m.plan_type && (
                        <div className="text-xs text-zinc-600">
                          {formatPlanType(m.plan_type)}
                          {m.next_plan_type && <span className="text-blue-400 ml-2">→ {formatPlanType(m.next_plan_type)} queued</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      {getStatusBadge(m.status, m.days_remaining)}
                      {exp && (
                        <div className="mt-1">
                          <div className={`text-xs ${exp.color}`}>{exp.primary}</div>
                          <div className="text-xs text-zinc-600">{exp.secondary}</div>
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}