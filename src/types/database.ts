// Database types for Fitness 16

export type Location = 'juja' | 'ruaka'
export type PlanType = 'day' | 'week' | 'month' | 'quarterly' | 'semi_annual' | 'annual'
export type MembershipStatus = 'active' | 'expired' | 'cancelled'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type CheckinType = 'facial' | 'manual' | 'walkin'
export type StaffRole = 'admin' | 'reception'
export type FeedbackType = 'suggestion' | 'complaint' | 'praise' | 'bug' | 'other'
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved'
export type GoalType = 'weight' | 'workout' | 'streak' | 'custom'

export interface Member {
  id: string
  phone: string
  email: string | null
  first_name: string
  last_name: string
  home_location: Location
  referral_code: string
  referred_by: string | null
  profile_photo_url: string | null
  privacy_consent: boolean
  terms_consent: boolean
  marketing_consent: boolean
  consent_timestamp: string | null
  workout_reminders: boolean
  expiry_alerts: boolean
  promotional_messages: boolean
  current_streak: number
  longest_streak: number
  weekly_goal: number
  last_active: string
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  member_id: string
  plan_type: PlanType
  start_date: string
  expiry_date: string
  status: MembershipStatus
  payment_id: string | null
  location: Location | null
  is_complimentary: boolean
  notes: string | null
  created_at: string
}

export interface Payment {
  id: string
  member_id: string | null
  amount: number
  plan_type: PlanType
  mpesa_receipt_number: string | null
  mpesa_transaction_id: string | null
  mpesa_checkout_request_id: string | null
  phone_number: string
  status: PaymentStatus
  failure_reason: string | null
  verified_with_safaricom: boolean
  verification_timestamp: string | null
  is_walkin: boolean
  walkin_name: string | null
  registered_by: string | null
  created_at: string
  updated_at: string
}

export interface Workout {
  id: string
  member_id: string
  name: string
  location: Location
  date: string
  notes: string | null
  duration_minutes: number | null
  created_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight_kg: number | null
  order_index: number
  created_at: string
}

export interface Weight {
  id: string
  member_id: string
  kg: number
  date: string
  notes: string | null
  created_at: string
}

export interface Goal {
  id: string
  member_id: string
  icon: string
  title: string
  type: GoalType
  target: number
  current: number
  unit: string
  deadline: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  member_id: string
  achievement_type: string
  unlocked_at: string
}

export interface ProgressPhoto {
  id: string
  member_id: string
  photo_url: string
  label: string | null
  date: string
  notes: string | null
  created_at: string
}

export interface Checkin {
  id: string
  member_id: string | null
  location: Location
  timestamp: string
  type: CheckinType
  registered_by: string | null
  walkin_name: string | null
  walkin_phone: string | null
  payment_id: string | null
}

export interface Feedback {
  id: string
  member_id: string | null
  type: FeedbackType
  message: string
  status: FeedbackStatus
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Staff {
  id: string
  phone: string
  email: string | null
  name: string
  role: StaffRole
  location: Location | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReferralReward {
  id: string
  referrer_id: string
  referee_id: string
  referrer_reward_type: string | null
  referee_reward_type: string | null
  referrer_reward_applied: boolean
  referee_reward_applied: boolean
  created_at: string
}

export interface SecurityLog {
  id: string
  event_type: string
  user_id: string | null
  user_type: 'member' | 'staff' | null
  ip_address: string | null
  user_agent: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface OtpCode {
  id: string
  phone: string
  code: string
  attempts: number
  expires_at: string
  used: boolean
  created_at: string
}

// Plan pricing (in KES)
export const PLAN_PRICES: Record<PlanType, number> = {
  day: 500,
  week: 2000,
  month: 5500,
  quarterly: 15000,
  semi_annual: 30000,
  annual: 54000,
}

// Plan durations (in days)
export const PLAN_DAYS: Record<PlanType, number> = {
  day: 1,
  week: 7,
  month: 30,
  quarterly: 90,
  semi_annual: 180,
  annual: 365,
}