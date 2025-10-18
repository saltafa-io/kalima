// File: lib/supabase/utils.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side rendering (SSR) contexts.
 * This is a utility function that can be used in Server Components, Route
 * Handlers, and Server Actions.
 *
 * @param cookieStore - The cookie store from `next/headers` or a custom
 * implementation for Route Handlers and Middleware.
 * @returns A Supabase client configured for the server-side.
 */
export function createSupabaseServerClient(
  cookieStore: ReturnType<typeof cookies> | {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string, options: CookieOptions) => void;
    remove: (name: string, options: CookieOptions) => void;
  }
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name:string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', options);
        },
      },
    }
  );
}