'use client';

import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('name, email, level, goals')
            .eq('id', session.user.id)
            .single();
          // If the profile doesn't exist, it's a new user. Redirect to enrollment.
          // The 'PGRST116' code indicates that a single row was requested but not found.
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile fetch error:', profileError);
            setError(`Failed to fetch profile: ${profileError.message}`);
            return;
          }
          if (!profile || !profile.level || !profile.goals?.length) {
            router.push('/enrollment');
          } else {
            router.push('/dashboard');
          }
        } else {
          setError(null); // Clear error on sign-out
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError('An unexpected error occurred during sign-in. Please try again.');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
      {/* Decorative Arabic text with animations */}
      <div className="absolute top-20 left-10 text-white/10 text-6xl font-arabic animate-bounce">تسجيل الدخول</div>
      <div className="absolute top-60 right-10 text-white/10 text-6xl font-arabic animate-bounce delay-1000">مرحبا</div>
      <div className="absolute bottom-20 left-20 text-white/10 text-6xl font-arabic animate-bounce delay-2000">ابدأ</div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 font-arabic">كليمة - تسجيل الدخول</h1>
        <p className="text-gray-600 mb-6">Sign in with Google to start learning Arabic with AI-powered voice feedback.</p>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p>{error}</p>
            <p className="text-sm mt-2">Please check the console for details or contact support.</p>
          </div>
        )}
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
          redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth`}
          onlyThirdPartyProviders
        />
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