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
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (query.length < 2) {
      return NextResponse.json({ members: [] });
    }

    const { data: members, error } = await adminClient
      .from('members')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        memberships (
          plan_type,
          status,
          expiry_date
        )
      `)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const processedMembers = members?.map((member) => {
      const activeMembership = member.memberships?.find(
        (m: { status: string; expiry_date: string }) => m.status === 'active'
      );

      let membershipStatus = 'none';
      let daysRemaining = null;

      if (activeMembership) {
        const expiryDate = new Date(activeMembership.expiry_date);
        const today = new Date();
        daysRemaining = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining <= 0) {
          membershipStatus = 'expired';
        } else if (daysRemaining <= 7) {
          membershipStatus = 'expiring';
        } else {
          membershipStatus = 'active';
        }
      }

      return {
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        phone: member.phone,
        membership_status: membershipStatus,
        days_remaining: daysRemaining,
      };
    });

    return NextResponse.json({ members: processedMembers || [] });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}