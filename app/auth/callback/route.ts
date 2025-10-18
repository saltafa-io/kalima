// File: app/auth/callback/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This is an asynchronous GET request handler for the /auth/callback route.
 * Its primary job is to securely handle the final step of the OAuth login flow.
 * When a user logs in via Google, Supabase redirects them here with a temporary `code`.
 * This server-side route exchanges that code for a permanent user session cookie.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  // The middleware is responsible for exchanging the code for a session.
  // This route simply redirects the user to the page they were trying to access.
  // If no origin is present, it defaults to the dashboard.
  const origin = requestUrl.searchParams.get('origin') || '/dashboard';
  return NextResponse.redirect(new URL(origin, requestUrl.origin));
}