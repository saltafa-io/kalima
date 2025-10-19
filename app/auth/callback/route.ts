// File: app/auth/callback/route.ts

import { NextResponse, type NextRequest } from 'next/server';

/**
 * This route handles the OAuth callback from Supabase.
 * It is now only responsible for redirecting the user to their destination.
 * The session exchange is handled by the middleware.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get('next') ?? '/dashboard';

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, request.url));
}