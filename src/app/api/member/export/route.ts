import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

// GET /api/member/export?member_id=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')

    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'member_id required' } },
        { status: 400 }
      )
    }

    // Get all member data
    const [
      { data: member },
      { data: memberships },
      { data: payments },
      { data: workouts },
      { data: weights },
      { data: goals },
      { data: checkins },
      { data: feedback },
    ] = await Promise.all([
      adminClient.from('members').select('*').eq('id', memberId).single(),
      adminClient.from('memberships').select('*').eq('member_id', memberId),
      adminClient.from('payments').select('*').eq('member_id', memberId),
      adminClient.from('workouts').select('*, workout_exercises(*)').eq('member_id', memberId),
      adminClient.from('weights').select('*').eq('member_id', memberId),
      adminClient.from('goals').select('*').eq('member_id', memberId),
      adminClient.from('checkins').select('*').eq('member_id', memberId),
      adminClient.from('feedback').select('*').eq('member_id', memberId),
    ])

    if (!member) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      )
    }

    // Log export request (DPA compliance)
    await adminClient.from('security_logs').insert({
      event_type: 'DATA_EXPORT',
      user_id: memberId,
      user_type: 'member',
      details: { export_type: 'full' },
    })

    return NextResponse.json({
      success: true,
      export_date: new Date().toISOString(),
      data: {
        personal_information: {
          id: member.id,
          phone: member.phone,
          email: member.email,
          first_name: member.first_name,
          last_name: member.last_name,
          home_location: member.home_location,
          referral_code: member.referral_code,
          created_at: member.created_at,
          consent: {
            privacy: member.privacy_consent,
            terms: member.terms_consent,
            marketing: member.marketing_consent,
            timestamp: member.consent_timestamp,
          },
        },
        memberships: memberships || [],
        payments: (payments || []).map(p => ({
          id: p.id,
          amount: p.amount,
          plan_type: p.plan_type,
          status: p.status,
          mpesa_receipt: p.mpesa_receipt_number,
          created_at: p.created_at,
        })),
        fitness_data: {
          workouts: workouts || [],
          weights: weights || [],
          goals: goals || [],
          stats: {
            current_streak: member.current_streak,
            longest_streak: member.longest_streak,
            weekly_goal: member.weekly_goal,
          },
        },
        checkins: checkins || [],
        feedback: feedback || [],
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}