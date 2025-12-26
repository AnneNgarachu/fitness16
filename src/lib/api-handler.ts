import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from './errors'

type Handler = (req: Request) => Promise<NextResponse>

export function withErrorHandler(handler: Handler): Handler {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: error.issues[0].message,
              details: error.issues,
            },
          },
          { status: 400 }
        )
      }

      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          { status: error.statusCode }
        )
      }

      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong',
          },
        },
        { status: 500 }
      )
    }
  }
}