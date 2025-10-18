// File: app/auth/callback/route.ts

import { NextResponse, type NextRequest } from 'next/server';

/**
 * This server-side route is the designated redirect URL for the OAuth provider.
 * The `@supabase/ssr` middleware intercepts the request, exchanges the `code`
 * for a session, and sets the session cookie on the response.
 *
 * This route's only job is to redirect the user to their final destination
 * after the middleware has done its work.
 */
export async function GET(request: NextRequest) {
  // URL to redirect to after sign in process completes
  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';
  return NextResponse.redirect(new URL(next, request.url));
}