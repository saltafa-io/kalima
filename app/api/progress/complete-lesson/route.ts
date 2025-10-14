import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 1. Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const user = session.user;

    // 2. Get lessonId and enrollmentId from the request body
    const { lessonId, enrollmentId } = await request.json();
    if (!lessonId || !enrollmentId) {
      return NextResponse.json({ error: 'Missing lessonId or enrollmentId' }, { status: 400 });
    }

    // 3. Upsert the progress record
    // RLS policies ensure a user can only update their own progress.
    // We use upsert to create a progress record if one doesn't exist yet.
    const { error: upsertError } = await supabase
      .from('user_lesson_progress')
      .upsert({
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        status: 'completed',
      }, { onConflict: 'enrollment_id, lesson_id' });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, message: 'Lesson marked as complete.' });

  } catch (error: any) {
    console.error('Error completing lesson:', error);
    return NextResponse.json({ error: 'Failed to complete lesson', details: error.message }, { status: 500 });
  }
}