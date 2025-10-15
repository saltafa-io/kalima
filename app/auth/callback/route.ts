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

  // URL to redirect to after sign in process completes
  const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  // After the session is set, redirect the user back to the auth page.
  // The `onAuthStateChange` listener on the auth page will then handle
  // redirecting the user to the correct page (dashboard or enrollment).
  const finalRedirectUrl = new URL('/auth', redirectUrl);
  return NextResponse.redirect(finalRedirectUrl);
}