// File: app/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase authentication middleware.
 *
 * This middleware is crucial for keeping the user's session fresh. It runs
 * on every request to the server. It reads the session from cookies, and if
 * the session is expired, it will attempt to refresh it.
 *
 * It then passes the updated session to subsequent Server Components or API
 * routes, ensuring they always have the most up-to-date authentication state.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function middleware(request: NextRequest) {
  // Create a response object to modify headers and cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client with the ability to read and write cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // The middleware is responsible for setting the cookie on the response
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // The middleware is responsible for removing the cookie from the response
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  // This will refresh the session if it's expired
  await supabase.auth.getSession();

  return response;
}

// Ensure the middleware is run on all paths except for static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};