import { z } from 'zod'

// Kenyan phone: 254 + 7/1 + 8 digits
export const phoneSchema = z
  .string()
  .regex(/^254[17]\d{8}$/, 'Invalid phone number. Use format: 254712345678')

export const sendOtpSchema = z.object({
  phone: phoneSchema,
})

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'OTP must be 6 digits'),
})

export const signupSchema = z.object({
  phone: phoneSchema,
  first_name: z.string().min(1, 'First name required').max(50),
  last_name: z.string().min(1, 'Last name required').max(50),
  email: z.string().email('Invalid email').optional(),
  home_location: z.enum(['juja', 'ruaka']),
  referral_code: z.string().max(20).optional(),
  privacy_consent: z.literal(true),
  terms_consent: z.literal(true),
  marketing_consent: z.boolean().default(false),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type SignupInput = z.infer<typeof signupSchema>