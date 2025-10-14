'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Curriculum } from '../../types/curriculum';
import { User } from '@supabase/supabase-js';
import { BookOpen, User as UserIcon, TrendingUp, CheckCircle } from 'lucide-react';

export default function CurriculaPage() {
  const router = useRouter();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null); // Tracks which curriculum is being enrolled
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/auth');
        return;
      }
      setUser(currentUser);

      const { data, error: curriculaError } = await supabase
        .from('curricula')
        .select('*')
        .order('name');

      if (curriculaError) {
        setError(curriculaError.message);
      } else {
        setCurricula(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleEnroll = async (curriculum: Curriculum) => {
    if (!user) {
      setError('You must be logged in to enroll.');
      return;
    }

    setEnrolling(curriculum.id);
    setError(null);

    try {
      // 1. Enroll the user in the curriculum and get the enrollment ID
      const { data: enrollmentData, error: enrollError } = await supabase.from('user_enrollments').upsert({
        user_id: user.id,
        curriculum_id: curriculum.id,
        status: 'in-progress',
      }, { onConflict: 'user_id, curriculum_id' }).select('id').single();

      if (enrollError) throw enrollError;
      if (!enrollmentData) throw new Error('Could not retrieve enrollment details.');
      const enrollmentId = enrollmentData.id;

      // 2. Fetch the first lesson's items to pass to the learn page
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('curriculum_id', curriculum.id)
        .order('order')
        .limit(1);

      if (lessonsError) throw lessonsError;
      if (!lessons || lessons.length === 0) {
        throw new Error('This curriculum has no lessons yet.');
      }

      const firstLessonId = lessons[0].id;

      const { data: lessonItems, error: itemsError } = await supabase
        .from('lesson_items')
        .select('content_arabic')
        .eq('lesson_id', firstLessonId)
        .order('order');

      if (itemsError) throw itemsError;

      const lessonContent = lessonItems?.map(item => item.content_arabic) || [];
      
      // 3. Redirect to the learn page with all necessary IDs and content
      const params = new URLSearchParams();
      params.set('lessons', JSON.stringify(lessonContent));
      params.set('lessonId', firstLessonId);
      params.set('enrollmentId', enrollmentId);
      router.push(`/learn?${params.toString()}`);

    } catch (err: any) {
      setError(`Failed to enroll: ${err.message}`);
      setEnrolling(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading curricula...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Available Curricula</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {curricula.map((curriculum) => (
            <div key={curriculum.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
              <div className="flex-grow">
                <h2 className="text-xl font-bold text-blue-700 mb-2">{curriculum.name}</h2>
                <p className="text-gray-600 mb-4">{curriculum.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Level: <span className="font-medium ml-1 capitalize">{curriculum.target_level}</span>
                </div>
              </div>
              <button
                onClick={() => handleEnroll(curriculum)}
                disabled={!!enrolling}
                className="mt-6 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {enrolling === curriculum.id ? 'Enrolling...' : 'Start Learning'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
