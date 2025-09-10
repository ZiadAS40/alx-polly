import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporarily disabled Supabase authentication for testing
  // Just pass through all requests
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}