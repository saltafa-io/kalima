'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { PlayCircle, PlusCircle } from 'lucide-react';
import { getNextLesson } from '../../lib/services/curriculumService';

interface DashboardData {
  enrollment_id: string;
  curriculum_id: string;
  curriculum_name: string;
  curriculum_description: string;
  total_lessons: number;
  completed_lessons: number;
  next_lesson_title?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [continuingId, setContinuingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/auth');
        return;
      }

      // Call the RPC function to get all dashboard data in one go
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_dashboard_data');

      if (rpcError) {
        setError(rpcError.message);
      } else {
        const data = rpcData || [];
        // Fetch the next lesson for each enrollment
        const enrichedData = await Promise.all(
          data.map(async (item: Omit<DashboardData, 'next_lesson_title'>) => {
            const nextLesson = await getNextLesson(item.enrollment_id);
            return {
              ...item,
              next_lesson_title: nextLesson?.title || (item.completed_lessons === item.total_lessons ? 'Completed!' : 'No upcoming lesson'),
            };
          })
        );
        setDashboardData(enrichedData);

        // Fetch user's name for the welcome message
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', currentUser.id).single();
        setUserName(profile?.name || '');
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleContinue = async (enrollmentId: string) => {
    setContinuingId(enrollmentId);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_next_lesson_for_enrollment', {
        enrollment_id_param: enrollmentId,
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0 || !data[0].content) {
        // This can happen if the curriculum is completed or has no lessons.
        // Redirect to the curricula page as a fallback.
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
            {userName && <p className="text-lg text-gray-600 mt-1">Welcome back, {userName}!</p>}
          </div>
          <button
            onClick={() => router.push('/curricula')}
            className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Browse New Curricula
          </button>
        </div>
        
        {dashboardData.length === 0 ? (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">You haven&apos;t enrolled in any curricula yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dashboardData.map((item) => {
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

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded-lg w-48"></div>
        </div>
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="w-2/3">
                  <div className="h-6 bg-gray-300 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-10 bg-gray-300 rounded-lg w-32"></div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-gray-300 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
