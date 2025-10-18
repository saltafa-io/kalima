import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getNextLesson } from '../../lib/services/curriculumService';
import DashboardClient, { DashboardData, RecentLesson } from './DashboardClient';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  // Fetch all data on the server in parallel
  const [dashboardResult, activityResult, profileResult] = await Promise.all([
    supabase.rpc('get_user_dashboard_data'),
    supabase.rpc('get_user_activity_stats'),
    supabase.from('profiles').select('name').eq('id', user.id).single(),
  ]);

  // Process and enrich data
  const { data: rpcData, error: rpcError } = dashboardResult;
  if (rpcError) throw rpcError; // Or handle error gracefully
  const data = rpcData || [];
  const enrichedData: DashboardData[] = await Promise.all(
    data.map(async (item: Omit<DashboardData, 'next_lesson_title'>) => {
      const nextLesson = await getNextLesson(item.enrollment_id);
      return {
        ...item,
        next_lesson_title: nextLesson?.title || (item.completed_lessons === item.total_lessons ? 'Completed!' : 'No upcoming lesson'),
      };
    })
  );

  const { data: activityData, error: activityError } = activityResult;
  if (activityError) throw activityError;

  const streak = activityData?.[0]?.current_streak || 0;
  const recentActivity: RecentLesson[] = activityData?.[0]?.recent_lessons || [];
  const userName = profileResult.data?.name || '';

  return (
    <DashboardClient
      initialDashboardData={enrichedData}
      initialUserName={userName}
      initialStreak={streak}
      initialRecentActivity={recentActivity}
    />
  );
}
