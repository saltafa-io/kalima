import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This route is responsible for exchanging an authorization code for a
 * user session. This is a server-side flow that is more secure than
 * handling the session on the client.
 *
 * It is called by the Supabase Auth UI after a user successfully signs in
 * with an OAuth provider.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // After the session is set, redirect the user back to the auth page.
  // The `onAuthStateChange` listener on the auth page will then handle
  // redirecting the user to the correct page (dashboard or enrollment).
  const redirectUrl = new URL('/auth', request.url);
  return NextResponse.redirect(redirectUrl);
}