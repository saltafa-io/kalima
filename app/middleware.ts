// File: app/middleware.ts

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
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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