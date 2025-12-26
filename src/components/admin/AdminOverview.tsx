'use client';

import { StatsCard } from './StatsCard';
import RevenueChart from './RevenueChart';
import MembershipChart from './MembershipChart';
import { PaymentsTable } from './PaymentsTable';

interface Stats {
  totalMembers: number;
  activeMembers: number;
  todayCheckIns: number;
  expiringSoon: number;
  monthRevenue: number;
}

interface MembershipData {
  name: string;
  value: number;
  color: string;
}

interface CheckIn {
  id: string;
  member_name?: string;
  timestamp: string;
  location: string;
  type: string;
}

interface AdminOverviewProps {
  stats: Stats;
  revenueData: { month: string; revenue: number }[];
  membershipBreakdown: MembershipData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentPayments: any[];
  todayCheckIns: CheckIn[];
  locationFilter: string;
  onLocationChange: (location: string) => void;
}

export function AdminOverview({
  stats,
  revenueData,
  membershipBreakdown,
  recentPayments,
  todayCheckIns,
  locationFilter,
  onLocationChange,
}: AdminOverviewProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'facial': return '✨ Auto';
      case 'manual': return '✓ Member';
      case 'walkin': return '🚶 Walk-in';
      default: return type;
    }
  };

  return (
    <>
      {/* Location Filter */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Overview</h2>
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-sm">Location:</span>
          <select
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Locations</option>
            <option value="juja">Juja</option>
            <option value="ruaka">Ruaka</option>
          </select>
        </div>
      </div>

      {/* Location Badge */}
      {locationFilter !== 'all' && (
        <div className="mb-6 flex items-center gap-2">
          <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
            📍 Showing data for {locationFilter.charAt(0).toUpperCase() + locationFilter.slice(1)} only
          </span>
          <button
            onClick={() => onLocationChange('all')}
            className="text-zinc-400 hover:text-white text-sm underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard icon="👥" label="Total Members" value={stats.totalMembers} />
        <StatsCard icon="✅" label="Active Members" value={stats.activeMembers} color="text-green-400" />
        <StatsCard icon="🚶" label="Today's Check-ins" value={stats.todayCheckIns} color="text-orange-400" />
        <StatsCard icon="⚠️" label="Expiring Soon" value={stats.expiringSoon} color="text-yellow-400" />
        <StatsCard
          icon="💰"
          label="This Month"
          value={`KES ${stats.monthRevenue.toLocaleString()}`}
          color="text-green-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">💰 Monthly Revenue</h3>
          <RevenueChart data={revenueData} />
        </div>

        {/* Membership Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">📊 Membership Status</h3>
          <MembershipChart data={membershipBreakdown} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-lg mb-4">Recent Payments</h3>
          <PaymentsTable payments={recentPayments} />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4">Today&apos;s Check-ins</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {todayCheckIns.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">No check-ins today</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {todayCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm">
                        {checkIn.member_name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{checkIn.member_name || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{formatType(checkIn.type)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-400">{formatTime(checkIn.timestamp)}</span>
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 capitalize">
                        📍 {checkIn.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}