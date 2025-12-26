import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    // Query members - NO location filter here, let frontend handle it
    let query = adminClient
      .from('members')
      .select('id, first_name, last_name, phone, home_location, created_at')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: members, error: membersError } = await query;

    if (membersError) {
      console.error('Members error:', membersError);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    if (!members?.length) {
      return NextResponse.json({ members: [], counts: { total: 0, active: 0, expiring: 0, expired: 0 } });
    }

    // Query memberships separately
    const memberIds = members.map(m => m.id);
    const { data: memberships } = await adminClient
      .from('memberships')
      .select('member_id, plan_type, status, expiry_date, next_plan_type, next_plan_paid')
      .in('member_id', memberIds);

    // Process
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const planLabels: Record<string, string> = {
      day: 'Day', week: 'Week', month: 'Month',
      quarterly: 'Quarterly', semi_annual: '6 Months', annual: 'Annual',
    };

    const processed = members.map((m) => {
      const mships = memberships?.filter(ms => ms.member_id === m.id) || [];
      const active = mships.find(ms => ms.status === 'active');
      const expired = mships.find(ms => ms.status === 'expired');
      const current = active || expired;

      let memberStatus = 'none';
      let daysRemaining: number | null = null;

      if (current) {
        const exp = new Date(current.expiry_date);
        daysRemaining = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= 0) memberStatus = 'expired';
        else if (daysRemaining <= 7) memberStatus = 'expiring';
        else memberStatus = 'active';
      }

      return {
        id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
        home_location: m.home_location,  // FIXED: was 'location'
        plan_type: current ? (planLabels[current.plan_type] || current.plan_type) : null,
        expiry_date: current?.expiry_date || null,
        status: memberStatus,
        days_remaining: daysRemaining,
      };
    });

    return NextResponse.json({
      members: processed,
      counts: {
        total: processed.length,
        active: processed.filter(m => m.status === 'active').length,
        expiring: processed.filter(m => m.status === 'expiring').length,
        expired: processed.filter(m => m.status === 'expired').length,
      },
    });
  } catch (error) {
    console.error('Admin members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}