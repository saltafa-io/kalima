// File: lib/supabase/server.ts

import { cookies } from 'next/headers';
import { createSupabaseServerClient } from './utils';

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers that use the `cookies()` function from `next/headers`.
 */
export function createClient() {
  const cookieStore = cookies();
  return createSupabaseServerClient(cookieStore);
}