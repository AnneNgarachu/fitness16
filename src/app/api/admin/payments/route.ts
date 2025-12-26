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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: payments, error } = await adminClient
      .from('payments')
      .select(`
        id,
        amount,
        plan_type,
        mpesa_receipt_number,
        status,
        created_at,
        members (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Payments query error:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Process to flatten member name
    const processedPayments = payments?.map((payment) => {
      const member = payment.members as unknown as { first_name: string; last_name: string } | null;
      return {
        id: payment.id,
        amount: payment.amount,
        plan_type: payment.plan_type,
        mpesa_receipt_number: payment.mpesa_receipt_number,
        status: payment.status,
        created_at: payment.created_at,
        member_name: member
          ? `${member.first_name} ${member.last_name}`
          : 'Unknown',
      };
    });

    return NextResponse.json({ payments: processedPayments || [] });
  } catch (error) {
    console.error('Admin payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}