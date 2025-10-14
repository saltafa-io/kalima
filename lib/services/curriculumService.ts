import { supabase } from '../supabase';

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
export async function getNextLesson(enrollmentId: string): Promise<NextLessonInfo | null> {
  try {
    // We need the lesson's objective, so we'll query the tables directly
    // instead of using the RPC which was designed for the UI.
    const { data: nextLessonData, error: nextLessonError } = await supabase
      .from('lessons')
      .select('id, title, objective')
      .in('id', (
        supabase.from('user_lesson_progress')
          .select('lesson_id')
          .eq('enrollment_id', enrollmentId)
          .eq('status', 'completed')
          .then(({ data }) => (data || []).map(p => p.lesson_id))
      ), { isNot: true }) // Select lessons NOT in the completed list
      .order('order')
      .limit(1)
      .single();

    if (nextLessonError) throw nextLessonError;
    if (!nextLessonData) return null;

    return { lessonId: nextLessonData.id, title: nextLessonData.title, objective: nextLessonData.objective };
  } catch (error) {
    console.error('Error fetching next lesson:', error);
    return null;
  }
}