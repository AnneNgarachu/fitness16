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
    const location = searchParams.get('location') || 'all';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get start and end of the specified date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    let query = adminClient
      .from('checkins')
      .select(`
        id,
        location,
        type,
        timestamp,
        walkin_name,
        members (
          first_name,
          last_name
        )
      `)
      .gte('timestamp', dayStart.toISOString())
      .lte('timestamp', dayEnd.toISOString())
      .order('timestamp', { ascending: false });

    if (location !== 'all') {
      query = query.eq('location', location);
    }

    const { data: checkIns, error } = await query;

    if (error) {
      console.error('Check-ins query error:', error);
      return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
    }

    // Process to get member name
    const processedCheckIns = checkIns?.map((checkIn) => {
      const member = checkIn.members as unknown as { first_name: string; last_name: string } | null;
      return {
        id: checkIn.id,
        location: checkIn.location,
        type: checkIn.type,
        timestamp: checkIn.timestamp,
        member_name: member
          ? `${member.first_name} ${member.last_name}`
          : checkIn.walkin_name || 'Walk-in',
      };
    });

    return NextResponse.json({ checkIns: processedCheckIns || [] });
  } catch (error) {
    console.error('Admin check-ins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}