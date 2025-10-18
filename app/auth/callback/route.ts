// File: app/auth/callback/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/utils';

/**
 * This route handles the OAuth callback from Supabase.
 * It is responsible for exchanging the authorization `code` for a session
 * and then redirecting the user to their destination (the dashboard).
 *
 * The middleware is still essential for keeping the session fresh on subsequent
 * requests, but this callback must handle the initial session creation.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  const response = NextResponse.redirect(new URL(next, request.url));

  if (code) {
    const supabase = createSupabaseServerClient({
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options) {
        response.cookies.set({ name, value: '', ...options });
      },
    });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return response;
}