'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Enrollment from '@/components/enrollment/Enrollment';

export default function EnrollmentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(`Failed to fetch session: ${sessionError.message}`);
          setLoading(false);
          return;
        }
        if (!session) {
          // No need to warn if we are redirecting, this is expected if the user is not logged in.
          router.push('/auth');
          return;
        }
        setUserId(session.user.id);
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    checkSession().catch(err => {
      console.error('Failed to check session:', err);
    });
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <p className="text-white text-xl font-arabic">جارٍ التحميل...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-10 text-white/10 text-6xl font-arabic animate-bounce">تسجيل</div>
        <div className="absolute top-60 right-10 text-white/10 text-6xl font-arabic animate-bounce delay-1000">مرحبا</div>
        <div className="absolute bottom-20 left-20 text-white/10 text-6xl font-arabic animate-bounce delay-2000">ابدأ</div>
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 font-arabic">Error</h1>
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Error: {error}</p>
            <p className="text-sm mt-2">Please try again or contact support. Check the console for more details.</p>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="mt-6 flex items-center justify-center text-blue-600 hover:text-blue-800 mx-auto"
          >
            Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-20 left-10 text-white/10 text-6xl font-arabic animate-bounce">تسجيل</div>
      <div className="absolute top-60 right-10 text-white/10 text-6xl font-arabic animate-bounce delay-1000">مرحبا</div>
      <div className="absolute bottom-20 left-20 text-white/10 text-6xl font-arabic animate-bounce delay-2000">ابدأ</div>
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 font-arabic text-center">Kaleema - Enrollment</h1>
        {userId && <Enrollment userId={userId} />}
      </div>
    </main>
  );
}