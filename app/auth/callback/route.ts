// File: app/auth/callback/route.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * This route handles the OAuth callback from Supabase.
 * It is responsible for exchanging the authorization `code` for a session
 * and then redirecting the user to their destination (the dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    // Create a Supabase client that can read and write cookies in a Route Handler
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // The Route Handler is responsible for setting the cookie on the response
            request.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // The Route Handler is responsible for removing the cookie from the response
            request.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/dashboard`);
}