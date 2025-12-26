/**
 * Reception Dashboard Page
 * Location: src/app/reception/page.tsx
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReceptionHeader, MemberSearch, CheckInCard, WalkInForm,
  TodayCheckInsList, NewMemberForm, AddLeadForm, MembersList, LeadsTab,
} from '@/components/reception';

interface Staff { name: string; location: string; }
interface Member { id: string; first_name: string; last_name: string; phone: string; membership_status: string; days_remaining: number | null; plan_type?: string; expiry_date?: string; }
interface MemberListItem { id: string; first_name: string; last_name: string; phone: string; status: string; days_remaining: number | null; plan_type: string | null; expiry_date: string | null; next_plan_type: string | null; }
interface Lead { id: string; name: string; phone: string; source: string; status: string; notes: string | null; follow_up_date: string | null; }
interface CheckIn { id: string; member_name: string; timestamp: string; type: string; location: string; }

type Tab = 'checkin' | 'members' | 'leads';
type View = 'search' | 'checkin' | 'walkin' | 'newmember' | 'addlead';

export default function ReceptionDashboard() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('checkin');
  const [view, setView] = useState<View>('search');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [showCheckInsList, setShowCheckInsList] = useState(false);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsFilter, setLeadsFilter] = useState('all');

  const fetchAll = useCallback((loc: string) => {
    fetch(`/api/admin/checkins?location=${loc}`).then(r => r.json()).then(d => setTodayCheckIns(d.checkIns || []));
    setMembersLoading(true);
    fetch(`/api/admin/members?location=${loc}`).then(r => r.json()).then(d => { setMembers(d.members || []); setMembersLoading(false); });
    setLeadsLoading(true);
    fetch(`/api/leads?location=${loc}`).then(r => r.json()).then(d => { setLeads(d.leads || []); setLeadsLoading(false); });
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/reception/login'); return; }
        const data = await res.json();
        if (data.userType !== 'staff') { router.push('/reception/login'); return; }
        if (data.user?.role === 'admin') { router.push('/admin'); return; }
        if (!data.user?.location) { setError('No location assigned'); setLoading(false); return; }
        const loc = data.user.location.toLowerCase();
        setStaff({ name: data.user.name || 'Staff', location: loc });
        fetchAll(loc);
      } catch { router.push('/reception/login'); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, [router, fetchAll]);

  const handleComplete = () => { setSelectedMember(null); setView('search'); if (staff?.location) fetchAll(staff.location); };
  const handleCancel = () => { setSelectedMember(null); setView('search'); };
  const handleSelectMember = (m: Member) => { setSelectedMember(m); setView('checkin'); };
  const handleSelectListMember = (m: MemberListItem) => {
    setSelectedMember({ id: m.id, first_name: m.first_name, last_name: m.last_name, phone: m.phone, membership_status: m.status, days_remaining: m.days_remaining, plan_type: m.plan_type || undefined, expiry_date: m.expiry_date || undefined });
    setView('checkin');
  };
  const handleUpdateLead = async (id: string, status: string) => {
    await fetch('/api/leads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: id, status }) });
    if (staff?.location) fetch(`/api/leads?location=${staff.location}`).then(r => r.json()).then(d => setLeads(d.leads || []));
  };

  const loc = staff?.location || 'juja';
  const locName = staff?.location ? staff.location.charAt(0).toUpperCase() + staff.location.slice(1) : '';
  const newLeads = leads.filter(l => l.status === 'new').length;

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center p-4"><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center"><div className="text-5xl mb-4">⚠️</div><p className="text-zinc-400">{error}</p></div></div>;

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed: changed null to undefined */}
      <ReceptionHeader staffName={staff?.name} location={staff?.location} />
      
      <main className="max-w-4xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[{ id: 'checkin', label: '✅ Check-in' }, { id: 'members', label: '👥 Members' }, { id: 'leads', label: '🎯 Leads', badge: newLeads }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id as Tab); setView('search'); setSelectedMember(null); }}
              className={`px-4 py-2 rounded-xl font-semibold text-sm ${tab === t.id ? 'bg-linear-to-r from-orange-500 to-pink-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {t.label}{t.badge ? <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* CHECK-IN TAB */}
        {tab === 'checkin' && <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button onClick={() => setShowCheckInsList(true)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left hover:bg-zinc-800">
              <div className="text-2xl font-black text-orange-400">{todayCheckIns.length}</div><div className="text-zinc-500 text-xs">Today&apos;s Check-ins</div>
            </button>
            <button onClick={() => setView('walkin')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left hover:bg-zinc-800">
              <div className="text-2xl">🚶</div><div className="text-zinc-500 text-xs">Walk-in</div>
            </button>
            <button onClick={() => setView('newmember')} className="bg-linear-to-r from-orange-500 to-pink-500 rounded-xl p-4 text-left">
              <div className="text-2xl">➕</div><div className="text-white/80 text-xs">New Member</div>
            </button>
          </div>
          {view === 'search' && <><h2 className="text-xl font-bold mb-4">Member Check-in</h2><MemberSearch onSelectMember={handleSelectMember} /></>}
          {view === 'checkin' && selectedMember && <CheckInCard member={selectedMember} location={loc} onCheckIn={handleComplete} onCancel={handleCancel} />}
          {view === 'walkin' && <WalkInForm location={loc} onSuccess={handleComplete} onCancel={handleCancel} />}
          {view === 'newmember' && <NewMemberForm location={loc} onSuccess={handleComplete} onCancel={handleCancel} />}
        </>}

        {/* MEMBERS TAB */}
        {tab === 'members' && (view === 'checkin' && selectedMember
          ? <CheckInCard member={selectedMember} location={loc} onCheckIn={handleComplete} onCancel={handleCancel} />
          : <MembersList members={members} loading={membersLoading} search={memberSearch} onSearchChange={setMemberSearch} onSelectMember={handleSelectListMember} locationName={locName} />
        )}

        {/* LEADS TAB */}
        {tab === 'leads' && (view === 'addlead'
          ? <AddLeadForm location={loc} onSuccess={handleComplete} onCancel={handleCancel} />
          : <LeadsTab leads={leads} loading={leadsLoading} filter={leadsFilter} onFilterChange={setLeadsFilter} onAddLead={() => setView('addlead')} onUpdateStatus={handleUpdateLead} />
        )}
      </main>
      {showCheckInsList && <TodayCheckInsList checkIns={todayCheckIns} onClose={() => setShowCheckInsList(false)} />}
    </div>
  );
}