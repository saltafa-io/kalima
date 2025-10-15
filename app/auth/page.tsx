'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/**
 * AuthPage handles user authentication and redirection.
 * It displays the Supabase Auth UI for Google sign-in and manages the user's
 * session state to redirect them to the appropriate page after login.
 */
export default function AuthPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  /**
   * This callback function is triggered whenever the user's authentication state changes
   * (e.g., on sign-in or sign-out). It's wrapped in `useCallback` for performance
   * optimization, preventing it from being recreated on every render.
   */
  const handleAuthStateChange = useCallback(async (_event: string, session: Session | null) => {
    try { // The router object is stable and can be used directly inside the callback
      // If a session exists, the user has successfully signed in.
      if (session) {
        // Fetch the user's profile from the 'profiles' table.
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, email, level, goals')
          .eq('id', session.user.id)
          .single();

        // The 'PGRST116' error code from Supabase indicates that a single row was requested
        // but not found, which is expected for a new user. We ignore this specific error.
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
          setError(`Failed to fetch profile: ${profileError.message}`);
          return;
        }

        // If no profile is found, it's a new user. Redirect to the enrollment page.
        if (!profile) {
          router.push('/enrollment');
        } else {
          // If a profile exists, redirect the existing user to their dashboard.
          router.push('/dashboard');
        }
      } else {
        // If there is no session (user signed out), clear any existing errors.
        setError(null); // Clear error on sign-out
      }
    } catch (err) {
      // Catch any unexpected errors during the process.
      console.error('Auth state change error:', err);
      setError('An unexpected error occurred during sign-in. Please try again.');
    }
  }, [router]); // We keep router here to be explicit, but the key is its usage inside

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    // The `onAuthStateChange` listener returns a subscription object.
    // The cleanup function for this effect will unsubscribe from the listener
    // to prevent memory leaks when the component unmounts.
    return () => subscription.unsubscribe();
  }, [handleAuthStateChange]);

  // Construct the redirect URL dynamically on the client side.
  // This is the most robust way to ensure the correct origin is used,
  // avoiding issues with build-time environment variables.
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  // The component renders the main authentication UI.
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
      {/* Decorative Arabic text with animations */}
      <div className="absolute top-20 left-10 text-white/10 text-6xl font-arabic animate-bounce">تسجيل الدخول</div>
      <div className="absolute top-60 right-10 text-white/10 text-6xl font-arabic animate-bounce delay-1000">مرحبا</div>
      <div className="absolute bottom-20 left-20 text-white/10 text-6xl font-arabic animate-bounce delay-2000">ابدأ</div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 font-arabic">كليمة - تسجيل الدخول</h1>
        <p className="text-gray-600 mb-6">Sign in with Google to start learning Arabic with AI-powered voice feedback.</p>
        {/* Display any authentication or profile fetch errors to the user. */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p>{error}</p>
            <p className="text-sm mt-2">Please check the console for details or contact support.</p>
          </div>
        )}
        {/* The Supabase Auth UI component, configured for Google OAuth. */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: {
                background: 'linear-gradient(to right, #f97316, #ef4444)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '9999px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
              },
              container: {
                maxWidth: '100%',
              },
            },
          }}
          providers={['google']}
          // After authenticating with Google, the user is redirected back to this same
          // page (`/auth`) to allow the `onAuthStateChange` listener to handle the session.
          // The redirectTo URL is now determined dynamically on the client.
          redirectTo={redirectTo}
          onlyThirdPartyProviders
        />
        {/* A button to allow users to navigate back to the landing page. */}
        <button
          onClick={() => router.push('/')}
          className="mt-6 flex items-center justify-center text-blue-600 hover:text-blue-800 mx-auto"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>
      </div>
    </main>
  );
}