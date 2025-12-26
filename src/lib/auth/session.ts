import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!'
)

// Increased session duration for better UX
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours (a full work day)
const REFRESH_THRESHOLD = 1 * 60 * 60 * 1000 // Refresh if < 1 hour left

export interface SessionPayload {
  userId: string
  userType: 'member' | 'staff'
  phone: string
  exp?: number
}

interface SessionJWTPayload extends JWTPayload {
  userId: string
  userType: 'member' | 'staff'
  phone: string
}

export async function createSession(payload: Omit<SessionPayload, 'exp'>) {
  const expires = new Date(Date.now() + SESSION_DURATION)
  
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  })

  return token
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const sessionPayload = payload as SessionJWTPayload
    
    return {
      userId: sessionPayload.userId,
      userType: sessionPayload.userType,
      phone: sessionPayload.phone,
      exp: sessionPayload.exp,
    }
  } catch {
    return null
  }
}

export async function refreshSession(): Promise<boolean> {
  const session = await getSession()
  if (!session) return false

  const exp = session.exp ? session.exp * 1000 : 0
  const timeLeft = exp - Date.now()

  if (timeLeft < REFRESH_THRESHOLD) {
    await createSession({
      userId: session.userId,
      userType: session.userType,
      phone: session.phone,
    })
    return true
  }

  return false
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}