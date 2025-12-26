import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!'
)

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/workouts',
  '/api/member',
  '/api/workouts',
  '/api/weights',
  '/api/goals',
  '/api/feedback',
]

// Routes that are always public
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/auth/signup',
  '/api/payments/callback', // M-Pesa callback must be public
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route needs protection
  const needsAuth = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  
  if (!needsAuth) {
    return NextResponse.next()
  }

  // Verify session
  const token = request.cookies.get('session')?.value

  if (!token) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Login required' } },
        { status: 401 }
      )
    }
    // Pages redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    // Invalid/expired token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'SESSION_EXPIRED', message: 'Session expired' } },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}