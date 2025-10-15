import { createClient } from '@supabase/supabase-js';

// Determine the site URL based on the environment.
// 1. Use the NEXT_PUBLIC_SITE_URL for production.
// 2. Use the VERCEL_URL for preview deployments.
// 3. Fall back to localhost for local development.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://` + process.env.VERCEL_URL : '') ||
  'http://localhost:3000';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use the PKCE flow for all authentication operations.
    // This is more secure and is required for server-side auth helpers.
    // The siteURL is crucial for Supabase to construct correct redirect URLs.
    flowType: 'pkce'
  },
});