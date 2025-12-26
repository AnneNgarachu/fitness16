/**
 * Admin Dashboard Page
 * Location: src/app/admin/page.tsx
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminHeader,
  AdminOverview,
  MembersTable,
  PaymentsTable,
  CheckInsTable,
  FeedbackList,
  WalkInModal,
  LeadsTab,
} from '@/components/admin';

type Tab = 'overview' | 'members' | 'leads' | 'checkins' | 'payments' | 'feedback';

const MEMBERSHIP_COLORS = {
  active: '#22c55e',
  expiring: '#f97316',
  expired: '#ef4444',
};

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [members, setMembers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payments, setPayments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [checkIns, setCheckIns] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feedback, setFeedback] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [checkInLocationFilter, setCheckInLocationFilter] = useState('all');
  const [overviewLocationFilter, setOverviewLocationFilter] = useState('all');

  const filteredByLocation = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterByLoc = (items: any[], locField: string) => {
      if (overviewLocationFilter === 'all') return items;
      return items.filter(item => {
        const loc = item[locField] || item.home_location || item.location || '';
        return loc.toLowerCase() === overviewLocationFilter.toLowerCase();
      });
    };

    return {
      members: filterByLoc(members, 'home_location'),
      payments: filterByLoc(payments, 'location'),
      checkIns: filterByLoc(checkIns, 'location'),
    };
  }, [members, payments, checkIns, overviewLocationFilter]);

  const stats = useMemo(() => {
    const fm = filteredByLocation.members;
    const fp = filteredByLocation.payments;
    const fc = filteredByLocation.checkIns;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monthRevenue = fp.filter((p: any) => {
      const d = new Date(p.created_at);
      return p.status === 'completed' && d >= startOfMonth;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    return {
      totalMembers: fm.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeMembers: fm.filter((m: any) => m.status === 'active').length,
      todayCheckIns: fc.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiringSoon: fm.filter((m: any) => m.status === 'expiring').length,
      monthRevenue,
    };
  }, [filteredByLocation]);

  const membershipBreakdown = useMemo(() => {
    const fm = filteredByLocation.members;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active = fm.filter((m: any) => m.status === 'active').length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expiring = fm.filter((m: any) => m.status === 'expiring').length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expired = fm.filter((m: any) => m.status === 'expired').length;

    return [
      { name: 'Active', value: active, color: MEMBERSHIP_COLORS.active },
      { name: 'Expiring', value: expiring, color: MEMBERSHIP_COLORS.expiring },
      { name: 'Expired', value: expired, color: MEMBERSHIP_COLORS.expired },
    ];
  }, [filteredByLocation.members]);

  const revenueData = useMemo(() => {
    const fp = filteredByLocation.payments;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6: { month: string; monthIndex: number; revenue: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonth - i + 12) % 12;
      last6.push({ month: months[idx], monthIndex: idx, revenue: 0 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fp.forEach((p: any) => {
      if (p.status === 'completed') {
        const pm = new Date(p.created_at).getMonth();
        const md = last6.find(m => m.monthIndex === pm);
        if (md) md.revenue += p.amount || 0;
      }
    });

    return last6.map(({ month, revenue }) => ({ month, revenue }));
  }, [filteredByLocation.payments]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, pRes, cRes, fRes] = await Promise.all([
        fetch('/api/admin/members'),
        fetch('/api/admin/payments'),
        fetch('/api/admin/checkins'),
        fetch('/api/admin/feedback'),
      ]);

      if (mRes.ok) setMembers((await mRes.json()).members || []);
      if (pRes.ok) setPayments((await pRes.json()).payments || []);
      if (cRes.ok) setCheckIns((await cRes.json()).checkIns || []);
      if (fRes.ok) setFeedback((await fRes.json()).feedback || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/admin/login'); return; }
        const data = await res.json();
        if (data.userType !== 'staff') { router.push('/admin/login'); return; }
        fetchData();
      } catch { router.push('/admin/login'); }
    };
    checkAuth();
  }, [router, fetchData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWalkIn = async (data: any) => {
    try {
      const res = await fetch('/api/reception/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { setShowWalkInModal(false); fetchData(); }
    } catch (e) { console.error('Walk-in error:', e); }
  };

  // Search filter
  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const name = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || (m.phone || '').includes(searchQuery);
  });

  // Count after all filters (location + status)
  const displayedMembersCount = filteredMembers.filter(m => {
    const loc = (m.home_location || m.location || '').toLowerCase();
    const matchesLoc = locationFilter === 'all' || loc === locationFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesLoc && matchesStatus;
  }).length;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'members', label: '👥 Members' },
    { id: 'leads', label: '🎯 Leads' },
    { id: 'checkins', label: '✅ Check-ins' },
    { id: 'payments', label: '💰 Payments' },
    { id: 'feedback', label: '💬 Feedback' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* AdminHeader now has Walk-in button built in */}
      <AdminHeader />

      <nav className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex gap-1 px-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`px-5 py-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                tab === t.id ? 'text-orange-500 border-orange-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {tab === 'overview' && (
          <AdminOverview
            stats={stats}
            revenueData={revenueData}
            membershipBreakdown={membershipBreakdown}
            recentPayments={filteredByLocation.payments.slice(0, 5)}
            todayCheckIns={filteredByLocation.checkIns.slice(0, 5)}
            locationFilter={overviewLocationFilter}
            onLocationChange={setOverviewLocationFilter}
          />
        )}

        {tab === 'members' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Members ({displayedMembersCount})</h2>
            <MembersTable
              members={filteredMembers}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              locationFilter={locationFilter}
              onLocationChange={setLocationFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
            />
          </>
        )}

        {tab === 'leads' && <LeadsTab />}

        {tab === 'checkins' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Today&apos;s Check-ins ({checkIns.length})</h2>
            <CheckInsTable
              checkIns={checkIns}
              locationFilter={checkInLocationFilter}
              onLocationChange={setCheckInLocationFilter}
            />
          </>
        )}

        {tab === 'payments' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Payment History</h2>
            <PaymentsTable payments={payments} />
          </>
        )}

        {tab === 'feedback' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Member Feedback ({feedback.length})</h2>
            <FeedbackList feedback={feedback} />
          </>
        )}
      </main>

      {showWalkInModal && (
        <WalkInModal onClose={() => setShowWalkInModal(false)} onSubmit={handleWalkIn} />
      )}
    </div>
  );
}