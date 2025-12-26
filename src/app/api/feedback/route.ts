import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

// Validation schema
const feedbackSchema = z.object({
  type: z.enum(['suggestion', 'complaint', 'praise', 'bug', 'other']),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
    .transform(s => s.trim()),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session || session.userType !== 'member') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Please log in to submit feedback' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = feedbackSchema.parse(body);

    const { data, error } = await adminClient
      .from('feedback')
      .insert({
        member_id: session.userId,
        type: validated.type,
        message: validated.message,
        status: 'pending',
      })
      .select('id, type, created_at')
      .single();

    if (error) {
      console.error('Feedback insert error:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to submit feedback' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      feedback: {
        id: data.id,
        type: data.type,
        created_at: data.created_at,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: firstIssue?.message || 'Invalid input' } },
        { status: 400 }
      );
    }

    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || session.userType !== 'member') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
        { status: 401 }
      );
    }

    const { data, error } = await adminClient
      .from('feedback')
      .select('id, type, message, status, created_at')
      .eq('member_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Feedback fetch error:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to load feedback' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: data });

  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}