// File: app/auth/callback/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * This route handles the OAuth callback from Supabase.
 * It is responsible for exchanging the authorization `code` for a session
 * and then redirecting the user to their destination (the dashboard).
 *
 * The middleware is still essential for keeping the session fresh on subsequent
 * requests, but this callback must handle the initial session creation.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/dashboard`);
}