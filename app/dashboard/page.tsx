'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { BookCopy, PlayCircle } from 'lucide-react';

interface DashboardData {
  enrollment_id: string;
  curriculum_id: string;
  curriculum_name: string;
  curriculum_description: string;
  total_lessons: number;
  completed_lessons: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isContinuing, startTransition] = useTransition();
  const [continuingId, setContinuingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/auth');
        return;
      }
      setUser(currentUser);

      // Call the RPC function to get all dashboard data in one go
      const { data, error: rpcError } = await supabase.rpc('get_user_dashboard_data');

      if (rpcError) {
        setError(rpcError.message);
      } else {
        setDashboardData(data || []);
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

      startTransition(() => {
        const params = new URLSearchParams();
        params.set('lessons', JSON.stringify(lessonContent));
        params.set('lessonId', lessonId);
        params.set('enrollmentId', enrollmentId);
        router.push(`/learn?${params.toString()}`);
      });
    } catch (err: any) {
      setError(`Failed to continue lesson: ${err.message}`);
      setContinuingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Dashboard</h1>
        
        {dashboardData.length === 0 ? (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">You haven't enrolled in any curricula yet.</p>
            <button
              onClick={() => router.push('/curricula')}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Browse Curricula
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {dashboardData.map((item) => {
              const progress = item.total_lessons > 0 ? (item.completed_lessons / item.total_lessons) * 100 : 0;
              return (
                <div key={item.enrollment_id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-blue-700 mb-2">{item.curriculum_name}</h2>
                      <p className="text-gray-600 mb-4">{item.curriculum_description}</p>
                    </div>
                    <button
                      onClick={() => handleContinue(item.enrollment_id)}
                      disabled={isContinuing}
                      className="flex items-center bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      {isContinuing && continuingId === item.enrollment_id ? 'Loading...' : 'Continue'}
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{item.completed_lessons} / {item.total_lessons} Lessons</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
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
