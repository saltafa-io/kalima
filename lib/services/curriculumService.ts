import type { SupabaseClient } from '@supabase/supabase-js';

export interface NextLessonInfo {
  lessonId: string;
  title: string;
  objective: string;
}

/**
 * Fetches the next uncompleted lesson for a user within a specific curriculum enrollment.
 * This function relies on the `get_next_lesson_for_enrollment` RPC function in Supabase.
 *
 * @param enrollmentId The user's enrollment ID.
 * @returns A promise that resolves to the next lesson's information, or null if not found or completed.
 */
export async function getNextLesson(
  supabase: SupabaseClient,
  enrollmentId: string
): Promise<NextLessonInfo | null> {
  try {
    // First, get the IDs of all completed lessons for this enrollment
    const { data: completedLessons, error: progressError } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id')
      .eq('enrollment_id', enrollmentId)
      .eq('status', 'completed');

    if (progressError) {
      throw new Error(progressError.message, { cause: progressError });
    }
    const completedLessonIds = (completedLessons || []).map(p => p.lesson_id);

    // Then, find the first lesson that is NOT in the completed list
    const query = supabase
      .from('lessons')
      .select('id, title, objective');
    
    if (completedLessonIds.length > 0) {
      query.not('id', 'in', `(${completedLessonIds.join(',')})`);
    }

    const { data: nextLessonData, error: nextLessonError } = await query.order('order').limit(1).single();

    if (nextLessonError) {
      throw new Error(nextLessonError.message, { cause: nextLessonError });
    }
    if (!nextLessonData) return null;

    return { lessonId: nextLessonData.id, title: nextLessonData.title, objective: nextLessonData.objective };
  } catch (error) {
    console.error('Error fetching next lesson:', error);
    return null;
  }
}