import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { adminClient } from '@/lib/supabase/admin';

const checkInSchema = z.object({
  member_id: z.string().uuid(),
  location: z.enum(['juja', 'ruaka']),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session || session.userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = checkInSchema.parse(body);

    // Verify member exists and has active membership
    const { data: member, error: memberError } = await adminClient
      .from('members')
      .select(`
        id,
        first_name,
        last_name,
        memberships (
          status,
          expiry_date
        )
      `)
      .eq('id', data.member_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check for active membership
    const activeMembership = member.memberships?.find(
      (m: { status: string; expiry_date: string }) => {
        if (m.status !== 'active') return false;
        const expiryDate = new Date(m.expiry_date);
        return expiryDate >= new Date();
      }
    );

    if (!activeMembership) {
      return NextResponse.json(
        { error: 'Member does not have an active membership' },
        { status: 400 }
      );
    }

    // Create check-in record
    const { error: checkInError } = await adminClient
      .from('checkins')
      .insert({
        member_id: data.member_id,
        location: data.location,
        type: 'manual',
        registered_by: session.userId,
      });

    if (checkInError) {
      console.error('Check-in error:', checkInError);
      return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${member.first_name} ${member.last_name} checked in successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}