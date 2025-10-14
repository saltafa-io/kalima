'use client';

import React, { Suspense, useEffect, useState, useTransition } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import VoiceRecorder from '../../components/audio/VoiceRecorder';
import { ArrowLeft, ArrowRight, Check, LogOut } from 'lucide-react';
import { AgentResponse } from '../../types/agent';
import PronunciationFeedback from '../../components/feedback/PronunciationFeedback';

type ConversationTurn = {
  user: { text: string };
  agent: AgentResponse;
};

function LearnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lessonItems, setLessonItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [isAgentReplying, setIsAgentReplying] = useState(false);
  const [inputText, setInputText] = useState('');

  // State for API call
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastAudio, setLastAudio] = useState<Blob | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(`Failed to fetch session: ${sessionError.message}`);
          setPageLoading(false);
          return;
        }
        if (!session) {
          console.warn('No session found, redirecting to auth');
          router.push('/auth');
          return;
        }

        setLessonId(searchParams.get('lessonId'));
        setEnrollmentId(searchParams.get('enrollmentId'));

        const lessonsParam = searchParams.get('lessons');
        if (lessonsParam) {
          try {
            const decodedLessons = JSON.parse(lessonsParam);
            if (Array.isArray(decodedLessons) && decodedLessons.length > 0 && decodedLessons.every((l: string) => typeof l === 'string')) {
              setLessonItems(decodedLessons);
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
        setPageLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
        setPageLoading(false);
      }
    };

    checkSession();
  }, [router, searchParams]);

  const handleRecordingComplete = (blob: Blob) => {
    setLastAudio(blob);
  };

  const sendTurn = async (text: string, audio?: Blob | null) => {
    if (!text && !audio) return;

    setError(null);
    setIsAgentReplying(true);

    try {
      const formData = new FormData();
      formData.append('input', text);
      // Pass the context to the agent API
      if (enrollmentId) formData.append('enrollmentId', enrollmentId);
      if (lessonId) formData.append('lessonId', lessonId);
      if (audio) {
        formData.append('audio', audio, 'recording.webm');
      }

      const res = await fetch('/api/agent', {
        method: 'POST',
        body: formData,
      });

      const data: AgentResponse = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Agent API request failed');
      }

      setConversationHistory((h) => [...h, { user: { text }, agent: data }]);
      setLastAudio(null);
      setInputText('');
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsAgentReplying(false);
    }
  };

  const handleNextItem = () => {
    setConversationHistory([]); // Clear history for the next item
    if (currentItemIndex < lessonItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    }
  };

  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    }
  };

  const handleCompleteLesson = async () => {
    if (!lessonId || !enrollmentId) {
      setError('Cannot complete lesson: Missing lesson or enrollment ID.');
      return;
    }
    setIsCompleting(true);
    try {
      const response = await fetch('/api/progress/complete-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, enrollmentId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete lesson.');
      }
      // On success, redirect to the dashboard to see the updated progress
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsCompleting(false);
    }
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

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <p className="text-white text-xl font-arabic">جارٍ التحميل...</p>
      </main>
    );
  }

  if (error || lessonItems.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-10 text-white/10 text-6xl font-arabic animate-bounce">تعلم</div>
        <div className="absolute top-60 right-10 text-white/10 text-6xl font-arabic animate-bounce delay-1000">مرحبا</div>
        <div className="absolute bottom-20 left-20 text-white/10 text-6xl font-arabic animate-bounce delay-2000">ابدأ</div>
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 font-arabic">Error</h1>
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Error: {error || 'No lesson content available.'}</p>
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

  const currentItem = lessonItems[currentItemIndex];
  const isLastItem = currentItemIndex === lessonItems.length - 1;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-20 left-10 text-white/10 text-6xl font-arabic animate-bounce">تعلم</div>
      <div className="absolute top-60 right-10 text-white/10 text-6xl font-arabic animate-bounce delay-1000">مرحبا</div>
      <div className="absolute bottom-20 left-20 text-white/10 text-6xl font-arabic animate-bounce delay-2000">ابدأ</div>
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 font-arabic text-center">Practice Lesson</h1>
        <p className="text-center text-gray-500 mb-4">Item {currentItemIndex + 1} of {lessonItems.length}</p>
        <p className="text-3xl text-gray-800 mb-4 font-arabic text-center p-4 bg-gray-100 rounded-md">{currentItem}</p>

        <div className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="اكتب ردك أو استخدم الميكروفون"
            />
            <button
              onClick={() => sendTurn(inputText, lastAudio)}
              disabled={isAgentReplying}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
            >
              Send
            </button>
          </div>
        </div>

        <VoiceRecorder
          onResult={(t) => setInputText(t)}
          onRecordingComplete={handleRecordingComplete}
          onRecordingChange={() => {}}
          expectedText={currentItem}
          language="ar-SA"
        />

        {isAgentReplying && <p className="text-sm text-gray-500 text-center mt-4">Agent is replying...</p>}
        {error && <div className="text-red-600 text-center mt-4">{error}</div>}

        {/* Display conversation history for the current item */}
        <div className="mt-6 space-y-3 max-h-60 overflow-y-auto">
          {conversationHistory.map((turn, i) => (
            <div key={i} className="p-3 rounded bg-gray-100">
              <div className="text-sm text-gray-800">{turn.agent.response}</div>
              {turn.agent.pronunciationFeedback && <PronunciationFeedback feedback={turn.agent.pronunciationFeedback} />}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handlePreviousItem}
            disabled={currentItemIndex === 0}
            className="flex items-center text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </button>
          {isLastItem ? (
            <button
              onClick={handleCompleteLesson}
              disabled={isCompleting}
              className="flex items-center bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              <Check className="w-5 h-5 mr-2" />
              {isCompleting ? 'Completing...' : 'Complete Lesson'}
            </button>
          ) : (
            <button onClick={handleNextItem} className="flex items-center text-blue-600 hover:text-blue-800">
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push('/dashboard')}
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

export default function LearnPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <p className="text-white text-xl font-arabic">جارٍ التحميل...</p>
      </main>
    }>
      <LearnContent />
    </Suspense>
  );
}