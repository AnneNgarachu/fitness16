import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

// Plan durations in days
const PLAN_DURATIONS: Record<string, number> = {
  day: 1,
  week: 7,
  month: 30,
  quarterly: 90,
  semi_annual: 180,
  annual: 365,
};

// GET /api/cron/activate-plans
// Call this daily via Vercel Cron or external cron service
// Add to vercel.json: { "crons": [{ "path": "/api/cron/activate-plans", "schedule": "0 1 * * *" }] }
export async function GET(req: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    let activatedCount = 0;
    let expiredCount = 0;
    const errors: string[] = [];

    // 1. Find memberships with queued plans that are expired and paid
    const { data: membershipsToActivate, error: fetchError } = await adminClient
      .from('memberships')
      .select('*, members(first_name, last_name, phone)')
      .lt('expiry_date', today)
      .not('next_plan_type', 'is', null)
      .eq('next_plan_paid', true);

    if (fetchError) {
      console.error('[Cron] Fetch error:', fetchError);
      errors.push(`Fetch error: ${fetchError.message}`);
    }

    // 2. Activate each queued plan
    for (const membership of membershipsToActivate || []) {
      try {
        const planDays = PLAN_DURATIONS[membership.next_plan_type] || 30;
        
        // New plan starts day after old one expired
        const startDate = new Date(membership.expiry_date);
        startDate.setDate(startDate.getDate() + 1);
        
        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + planDays);

        await adminClient
          .from('memberships')
          .update({
            plan_type: membership.next_plan_type,
            start_date: startDate.toISOString().split('T')[0],
            expiry_date: expiryDate.toISOString().split('T')[0],
            status: 'active',
            next_plan_type: null,
            next_plan_paid: false,
            next_plan_payment_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', membership.id);

        activatedCount++;
        console.log(`[Cron] Activated ${membership.next_plan_type} for member ${membership.member_id}`);
      } catch (err) {
        const errorMsg = `Failed to activate for ${membership.member_id}: ${err}`;
        console.error(`[Cron] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // 3. Mark expired memberships (those without queued plans)
    const { data: expiredMemberships, error: expireError } = await adminClient
      .from('memberships')
      .select('id')
      .lt('expiry_date', today)
      .eq('status', 'active')
      .is('next_plan_type', null);

    if (expireError) {
      console.error('[Cron] Expire fetch error:', expireError);
      errors.push(`Expire fetch error: ${expireError.message}`);
    }

    if (expiredMemberships && expiredMemberships.length > 0) {
      const { error: updateError } = await adminClient
        .from('memberships')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .in('id', expiredMemberships.map(m => m.id));

      if (updateError) {
        errors.push(`Expire update error: ${updateError.message}`);
      } else {
        expiredCount = expiredMemberships.length;
      }
    }

    console.log(`[Cron] Completed: ${activatedCount} activated, ${expiredCount} expired`);

    return NextResponse.json({
      success: true,
      activated: activatedCount,
      expired: expiredCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// POST endpoint for manual trigger from admin
export async function POST(req: Request) {
  // Reuse GET logic
  return GET(req);
}