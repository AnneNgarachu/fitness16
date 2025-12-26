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
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = adminClient
      .from('feedback')
      .select(`
        id,
        type,
        message,
        status,
        created_at,
        members (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: feedback, error } = await query;

    if (error) {
      console.error('Feedback query error:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    const processedFeedback = feedback?.map((item) => {
      const member = item.members as unknown as { first_name: string; last_name: string } | null;
      return {
        id: item.id,
        type: item.type,
        message: item.message,
        status: item.status,
        created_at: item.created_at,
        member_name: member
          ? `${member.first_name} ${member.last_name}`
          : 'Anonymous',
      };
    });

    return NextResponse.json({ feedback: processedFeedback || [] });
  } catch (error) {
    console.error('Admin feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}