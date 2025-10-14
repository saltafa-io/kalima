import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Curriculum } from '../../types/curriculum';
import CurriculaClient from './CurriculaClient';

export default async function CurriculaPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  // Fetch all curricula and the user's enrollments in parallel
  const [curriculaResult, enrollmentsResult] = await Promise.all([
    supabase.from('curricula').select('*').order('name'),
    supabase.from('user_enrollments').select('curriculum_id').eq('user_id', user.id)
  ]);

  const { data: curriculaData, error: curriculaError } = curriculaResult;
  const { data: enrollmentsData, error: enrollmentsError } = enrollmentsResult;

  if (curriculaError || enrollmentsError) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {curriculaError?.message || enrollmentsError?.message}</div>;
  }

  const initialCurricula: Curriculum[] = curriculaData || [];
  const initialEnrolledIds: string[] = enrollmentsData?.map(e => e.curriculum_id) || [];

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <CurriculaClient 
        initialCurricula={initialCurricula} 
        initialEnrolledIds={initialEnrolledIds}
        user={user}
      />
    </main>
  );
}
