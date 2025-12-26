import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'

const signupSchema = z.object({
  phone: z.string().regex(/^254[17]\d{8}$/, 'Invalid phone number'),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  email: z.string().email().optional(),
  home_location: z.enum(['juja', 'ruaka']),
  referral_code: z.string().max(20).optional(),
  privacy_consent: z.literal(true),
  terms_consent: z.literal(true),
  marketing_consent: z.boolean().default(false),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = signupSchema.parse(body)

    // Check if phone already registered
    const { data: existing } = await adminClient
      .from('members')
      .select('id')
      .eq('phone', data.phone)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Phone number already registered' } },
        { status: 400 }
      )
    }

    // Validate referral code if provided
    let referrerId: string | null = null
    if (data.referral_code) {
      const { data: referrer } = await adminClient
        .from('members')
        .select('id')
        .eq('referral_code', data.referral_code.toUpperCase())
        .single()

      if (!referrer) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Invalid referral code' } },
          { status: 400 }
        )
      }
      referrerId = referrer.id
    }

    // Create member
    const { data: member, error: memberError } = await adminClient
      .from('members')
      .insert({
        phone: data.phone,
        email: data.email || null,
        first_name: data.first_name,
        last_name: data.last_name,
        home_location: data.home_location,
        referred_by: referrerId,
        privacy_consent: data.privacy_consent,
        terms_consent: data.terms_consent,
        marketing_consent: data.marketing_consent,
        consent_timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      console.error('Member creation error:', memberError)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create account' } },
        { status: 500 }
      )
    }

    // Create referral reward record if referred
    if (referrerId) {
      await adminClient.from('referral_rewards').insert({
        referrer_id: referrerId,
        referee_id: member.id,
      })
    }

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        phone: member.phone,
        first_name: member.first_name,
        last_name: member.last_name,
        referral_code: member.referral_code,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } },
        { status: 400 }
      )
    }
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}