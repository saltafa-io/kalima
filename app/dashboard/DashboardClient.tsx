'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { createClient } from '@/lib/supabase/client';
import { PlayCircle, PlusCircle, Flame, History } from 'lucide-react';

export interface RecentLesson {
  title: string;
  completed_at: string;
}

export interface DashboardData {
  enrollment_id: string;
  curriculum_id: string;
  curriculum_name: string;
  curriculum_description: string;
  total_lessons: number;
  completed_lessons: number;
  next_lesson_title?: string;
}

interface DashboardClientProps {
  initialDashboardData: DashboardData[];
  initialUserName: string;
  initialStreak: number;
  initialRecentActivity: RecentLesson[];
}

export default function DashboardClient({
  initialDashboardData,
  initialUserName,
  initialStreak,
  initialRecentActivity,
}: DashboardClientProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [continuingId, setContinuingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async (enrollmentId: string) => {
    setContinuingId(enrollmentId);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_next_lesson_for_enrollment', {
        enrollment_id_param: enrollmentId,
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0 || !data[0].content) {
        router.push('/curricula');
        return;
      }

      const nextLesson = data[0];
      const lessonContent = nextLesson.content;
      const lessonId = nextLesson.lesson_id;

      const params = new URLSearchParams();
      params.set('lessons', JSON.stringify(lessonContent));
      params.set('lessonId', lessonId);
      params.set('enrollmentId', enrollmentId);
      router.push(`/learn?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? `Failed to continue lesson: ${err.message}` : 'An unexpected error occurred.');
      setContinuingId(null);
    }
  };

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
            {initialUserName && <p className="text-lg text-gray-600 mt-1">Welcome back, {initialUserName}!</p>}
          </div>
          <button
            onClick={() => router.push('/curricula')}
            className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Browse New Curricula
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
            <Flame className="w-10 h-10 text-orange-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-2xl font-bold text-gray-800">{initialStreak} {initialStreak === 1 ? 'Day' : 'Days'}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-2">
              <History className="w-6 h-6 text-gray-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            </div>
            <ul className="space-y-2">
              {initialRecentActivity.length > 0 ? initialRecentActivity.map((activity, index) => (
                <li key={index} className="text-sm text-gray-600 flex justify-between">
                  <span>{activity.title}</span>
                  <span className="text-gray-400">{new Date(activity.completed_at).toLocaleDateString()}</span>
                </li>
              )) : (
                <li className="text-sm text-gray-500">No recent lessons completed.</li>
              )}
            </ul>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Curricula</h2>
        
        {initialDashboardData.length === 0 ? (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">You haven&apos;t enrolled in any curricula yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {initialDashboardData.map((item) => {
              const progress = item.total_lessons > 0 ? (item.completed_lessons / item.total_lessons) * 100 : 0;
              const isCompleted = item.completed_lessons === item.total_lessons && item.total_lessons > 0;
              return (
                <div key={item.enrollment_id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-blue-700 mb-2">{item.curriculum_name}</h2>
                      <p className="text-gray-600 mb-4">{item.curriculum_description}</p>
                      {!isCompleted && item.next_lesson_title && (
                        <p className="text-sm text-gray-500 font-medium">
                          Next up: <span className="font-semibold text-gray-700">{item.next_lesson_title}</span>
                        </p>
                      )}
                    </div>
                    {isCompleted ? (
                      <div className="flex items-center bg-green-100 text-green-800 font-semibold py-2 px-4 rounded-lg">
                        Completed! 🎉
                      </div>
                    ) : (
                      <button
                        onClick={() => handleContinue(item.enrollment_id)}
                        disabled={!!continuingId}
                        className="flex items-center bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 shrink-0 ml-4"
                      >
                        <PlayCircle className="w-5 h-5 mr-2" />
                        {continuingId === item.enrollment_id ? 'Loading...' : 'Continue'}
                      </button>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{item.completed_lessons} / {item.total_lessons} Lessons</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}