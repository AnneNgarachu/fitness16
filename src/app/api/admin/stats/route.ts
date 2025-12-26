import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { adminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total members
    const { count: totalMembers } = await adminClient
      .from('members')
      .select('*', { count: 'exact', head: true });

    // Get active memberships
    const { count: activeMembers } = await adminClient
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('expiry_date', new Date().toISOString());

    // Get expiring soon (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const { count: expiringSoon } = await adminClient
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('expiry_date', new Date().toISOString())
      .lte('expiry_date', sevenDaysFromNow.toISOString());

    // Get today's check-ins
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { count: todayCheckIns } = await adminClient
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', todayStart.toISOString());

    // Get this month's revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthPayments } = await adminClient
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', monthStart.toISOString());

    const monthRevenue = monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    return NextResponse.json({
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      expiringSoon: expiringSoon || 0,
      todayCheckIns: todayCheckIns || 0,
      monthRevenue,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}