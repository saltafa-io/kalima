// File: app/auth/callback/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This server-side route is the designated redirect URL for the OAuth provider.
 * After a user signs in, they are sent here. The `@supabase/ssr` middleware
 * has already exchanged the `code` for a session cookie by the time this
 * route is hit.
 *
 * This route's only job is to redirect the user back to a client-side page
 * where the `onAuthStateChange` listener can detect the session and manage
 * the final user navigation (e.g., to the dashboard).
 */
export async function GET(request: NextRequest) {
  // The `/auth` route is responsible for handling the user's session.
  return NextResponse.redirect(new URL('/auth', request.url));
}