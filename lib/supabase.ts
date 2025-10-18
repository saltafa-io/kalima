import { createClient } from '@supabase/supabase-js';

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