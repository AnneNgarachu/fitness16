import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

const updateFeedbackSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'resolved']),
  admin_notes: z.string().max(1000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getSession();

    if (!session || session.userType !== 'staff') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Staff access required' } },
        { status: 401 }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ID', message: 'Invalid feedback ID' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateFeedbackSchema.parse(body);

    const updateData: Record<string, unknown> = {
      status: validated.status,
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
    };

    if (validated.admin_notes !== undefined) {
      updateData.admin_notes = validated.admin_notes;
    }

    const { data, error } = await adminClient
      .from('feedback')
      .update(updateData)
      .eq('id', id)
      .select('id, status, reviewed_at, admin_notes')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
          { status: 404 }
        );
      }
      console.error('Feedback update error:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update feedback' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Feedback marked as ${validated.status}`,
      feedback: data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: firstIssue?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    console.error('Feedback PATCH error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}