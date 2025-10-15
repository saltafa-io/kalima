// File: app/auth/callback/route.ts

// Import necessary modules from Next.js and Supabase helpers.
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This is an asynchronous GET request handler for the /auth/callback route.
 * Its primary job is to securely handle the final step of the OAuth login flow.
 * When a user logs in via Google, Supabase redirects them here with a temporary `code`.
 * This server-side route exchanges that code for a permanent user session cookie.
 */
export async function GET(request: NextRequest) {
  // 1. Get the full URL from the incoming request to use as a base.
  const requestUrl = new URL(request.url);

  // 2. Extract the authorization 'code' from the URL's query parameters.
  // This code is provided by Supabase after a successful login with an OAuth provider.
  const code = requestUrl.searchParams.get('code');

  // 3. Retrieve the site's base URL from environment variables.
  // This is crucial for constructing absolute URLs for redirects, ensuring it works
  // in both local development (http://localhost:3000) and production on Vercel.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // Fail-safe: If the site URL is not configured, stop execution and throw an error.
  // This prevents unexpected behavior and makes the configuration issue obvious.
  if (!siteUrl) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable');
  }

  // 4. If a 'code' is present in the URL, proceed to exchange it for a session.
  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 5. Redirect the user to the /auth page. The client-side logic there
  // will detect the new session and route the user appropriately.
  const finalRedirectUrl = new URL('/auth', siteUrl);

  // 6. Return a response that tells the user's browser to navigate.
  return NextResponse.redirect(finalRedirectUrl);
}