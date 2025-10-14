'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Curriculum } from '../../types/curriculum';
import type { User } from '@supabase/supabase-js';
import { TrendingUp, Search } from 'lucide-react';

interface CurriculaClientProps {
  initialCurricula: Curriculum[];
  initialEnrolledIds: string[];
  user: User;
}

export default function CurriculaClient({ initialCurricula, initialEnrolledIds, user }: CurriculaClientProps) {
  const router = useRouter();
  const [curricula] = useState<Curriculum[]>(initialCurricula);
  const [enrolledCurriculaIds] = useState<Set<string>>(new Set(initialEnrolledIds));
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('name');
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const handleEnroll = async (curriculum: Curriculum) => {
    setEnrolling(curriculum.id);
    setError(null);

    try {
      const { data: enrollmentData, error: enrollError } = await supabase.from('user_enrollments').upsert({
        user_id: user.id,
        curriculum_id: curriculum.id,
        status: 'in-progress',
      }, { onConflict: 'user_id, curriculum_id' }).select('id').single();

      if (enrollError) throw enrollError;
      if (!enrollmentData) throw new Error('Could not retrieve enrollment details.');
      const enrollmentId = enrollmentData.id;

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
      
      const params = new URLSearchParams();
      params.set('lessons', JSON.stringify(lessonContent));
      params.set('lessonId', firstLessonId);
      params.set('enrollmentId', enrollmentId);
      router.push(`/learn?${params.toString()}`);

    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to enroll: ${err.message}`);
      } else {
        setError('An unexpected error occurred during enrollment.');
      }
      setEnrolling(null);
    }
  };

  const filteredCurricula = curricula
    .filter(curriculum => 
      levelFilter === 'all' || curriculum.target_level === levelFilter
    ).filter(curriculum =>
      curriculum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curriculum.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const sortedAndFilteredCurricula = [...filteredCurricula].sort((a, b) => {
    if (sortBy === 'level') {
      const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      return (levelOrder[a.target_level] || 0) - (levelOrder[b.target_level] || 0);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="max-w-4xl mx-auto">
      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Available Curricula</h1>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">Filter by level:</span>
        {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
          <button key={level} onClick={() => setLevelFilter(level)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${levelFilter === level ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="relative">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full md:w-auto p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8">
            <option value="name">Sort by Name</option>
            <option value="level">Sort by Level</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>
      {sortedAndFilteredCurricula.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedAndFilteredCurricula.map((curriculum) => (
            <div key={curriculum.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-700 mb-2">{curriculum.name}</h2>
                <p className="text-gray-600 mb-4">{curriculum.description}</p>
                <div className="flex items-center text-sm text-gray-500"><TrendingUp className="w-4 h-4 mr-2" />Level: <span className="font-medium ml-1 capitalize">{curriculum.target_level}</span></div>
              </div>
              {enrolledCurriculaIds.has(curriculum.id) ? (
                <button onClick={() => router.push('/dashboard')} className="mt-6 w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center">Enrolled (Go to Dashboard)</button>
              ) : (
                <button onClick={() => handleEnroll(curriculum)} disabled={!!enrolling} className="mt-6 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">{enrolling === curriculum.id ? 'Enrolling...' : 'Start Learning'}</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-8 rounded-lg shadow-md"><p className="text-gray-600">No curricula found matching your search.</p></div>
      )}
    </div>
  );
}