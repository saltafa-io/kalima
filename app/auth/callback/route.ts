import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';  // Your server client

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // If 'next' param is provided, use it; default to /dashboard
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to dashboard on success
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // On error, redirect to auth page with error message
  return NextResponse.redirect(`${origin}/auth?error=Could%20not%20authenticate%20user`);
}