'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import VoiceRecorder from '../../components/audio/VoiceRecorder';
import { ArrowLeft, LogOut } from 'lucide-react';

export default function LearnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lessons, setLessons] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState<string | undefined>(undefined);

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
          console.warn('No session found, redirecting to auth');
          router.push('/auth');
          return;
        }

        const lessonsParam = searchParams.get('lessons');
        if (lessonsParam) {
          try {
            const decodedLessons = JSON.parse(decodeURIComponent(lessonsParam));
            if (Array.isArray(decodedLessons) && decodedLessons.length > 0 && decodedLessons.every((l: any) => typeof l === 'string')) {
              setLessons(decodedLessons);
              setCurrentLesson(decodedLessons[0]);
            } else {
              setError('Invalid lessons data. Lessons must be a non-empty array of strings.');
            }
          } catch (err) {
            console.error('Error parsing lessons:', err);
            setError('Failed to load lessons');
          }
        } else {
          setError('No lessons provided');
        }
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    checkSession();
  }, [router, searchParams]);

  const handleRecordingComplete = (blob: Blob) => {
    console.log('Audio recorded:', blob);
    // Placeholder for pronunciation analysis (e.g., upload blob to API)
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <p className="text-white text-xl font-arabic">جارٍ التحميل...</p>
      </main>
    );
  }

  if (error || !currentLesson) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-10 text-white/10 text-6xl font-arabic animate-bounce">تعلم</div>
        <div className="absolute top-60 right-10 text-white/10 text-6xl font-arabic animate-bounce delay-1000">مرحبا</div>
        <div className="absolute bottom-20 left-20 text-white/10 text-6xl font-arabic animate-bounce delay-2000">ابدأ</div>
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 font-arabic">Error</h1>
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Error: {error || 'No lesson available'}</p>
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
      <div className="absolute top-20 left-10 text-white/10 text-6xl font-arabic animate-bounce">تعلم</div>
      <div className="absolute top-60 right-10 text-white/10 text-6xl font-arabic animate-bounce delay-1000">مرحبا</div>
      <div className="absolute bottom-20 left-20 text-white/10 text-6xl font-arabic animate-bounce delay-2000">ابدأ</div>
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 font-arabic text-center">Kaleema - Learn</h1>
        <p className="text-lg text-gray-700 mb-4 font-arabic">Practice saying: {currentLesson}</p>
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          onRecordingChange={() => {}}
          expectedText={currentLesson}
          language="ar-SA"
        />
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push('/enrollment')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Enrollment
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            Sign Out
            <LogOut className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </main>
  );
}