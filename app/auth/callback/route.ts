// File: app/auth/callback/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This server-side route is the designated redirect URL for the OAuth provider.
 * After a user signs in, they are sent here. The `@supabase/ssr` middleware
 * has already exchanged the `code` for a session cookie by the time this
 * route is hit.
 *
 * This route's only job is to redirect the user to their intended destination
 * after a successful login.
 */
export async function GET(request: NextRequest) {
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url));
}