import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { adminClient } from '@/lib/supabase/admin';

// Validation schemas
const createLeadSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(9).max(15),
  email: z.string().email().optional(),
  source: z.enum(['physical_visit', 'whatsapp', 'instagram', 'referral', 'phone_call', 'website']).default('physical_visit'),
  location: z.enum(['juja', 'ruaka']).optional(),
  notes: z.string().max(500).optional(),
  follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateLeadSchema = z.object({
  lead_id: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'follow_up', 'converted', 'lost']).optional(),
  notes: z.string().max(500).optional(),
  follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

// GET /api/leads - List leads with filters
export async function GET(req: Request) {
  try {
    const session = await getSession();
    
    // Debug logging - remove in production
    console.log('[Leads API] Session:', JSON.stringify(session, null, 2));
    
    if (!session) {
      console.log('[Leads API] No session found');
      return NextResponse.json({ error: 'Unauthorized - no session' }, { status: 401 });
    }
    
    if (session.userType !== 'staff') {
      console.log('[Leads API] Invalid userType:', session.userType);
      return NextResponse.json({ error: 'Unauthorized - not staff' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const location = searchParams.get('location') || 'all';
    const source = searchParams.get('source') || 'all';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = adminClient
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (location !== 'all') {
      query = query.eq('location', location);
    }
    if (source !== 'all') {
      query = query.eq('source', source);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Leads fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Get counts by status (apply location filter for accurate counts)
    let countsQuery = adminClient
      .from('leads')
      .select('status, location');
    
    if (location !== 'all') {
      countsQuery = countsQuery.eq('location', location);
    }
    
    const { data: allLeads } = await countsQuery;
    
    const statusCounts = {
      new: 0,
      contacted: 0,
      follow_up: 0,
      converted: 0,
      lost: 0,
      total: allLeads?.length || 0,
    };
    
    allLeads?.forEach((lead: { status: string }) => {
      if (lead.status in statusCounts) {
        statusCounts[lead.status as keyof typeof statusCounts]++;
      }
    });

    return NextResponse.json({
      leads: leads || [],
      counts: statusCounts,
    });
  } catch (error) {
    console.error('Leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/leads - Create new lead
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = createLeadSchema.parse(body);

    // Normalize phone
    let phone = data.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '254' + phone.slice(1);
    } else if (!phone.startsWith('254')) {
      phone = '254' + phone;
    }

    // Check if lead already exists
    const { data: existing } = await adminClient
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Lead with this phone already exists' } },
        { status: 400 }
      );
    }

    // Check if they're already a member
    const { data: existingMember } = await adminClient
      .from('members')
      .select('id, first_name, last_name')
      .eq('phone', phone)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { 
          error: { 
            code: 'IS_MEMBER', 
            message: `This person is already a member: ${existingMember.first_name} ${existingMember.last_name}` 
          } 
        },
        { status: 400 }
      );
    }

    // Create lead
    const { data: lead, error } = await adminClient
      .from('leads')
      .insert({
        name: data.name,
        phone,
        email: data.email,
        source: data.source,
        location: data.location,
        notes: data.notes,
        follow_up_date: data.follow_up_date,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Lead create error:', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      );
    }
    console.error('Lead create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/leads - Update lead status
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = updateLeadSchema.parse(body);

    const updateData: Record<string, unknown> = {};

    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.follow_up_date !== undefined) updateData.follow_up_date = data.follow_up_date;

    const { data: lead, error } = await adminClient
      .from('leads')
      .update(updateData)
      .eq('id', data.lead_id)
      .select()
      .single();

    if (error) {
      console.error('Lead update error:', error);
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      );
    }
    console.error('Lead update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/leads - Delete lead
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('lead_id');

    if (!leadId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'lead_id required' } },
        { status: 400 }
      );
    }

    const { error } = await adminClient
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      console.error('Lead delete error:', error);
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}