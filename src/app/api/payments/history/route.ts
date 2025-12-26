import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { adminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: payments, error } = await adminClient
      .from('payments')
      .select('id, amount, plan_type, mpesa_receipt_number, status, created_at')
      .eq('member_id', session.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json({ payments: payments || [] });
  } catch (error) {
    console.error('Payment history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}