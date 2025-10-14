// Types for Curriculum and Lesson Management System

import { UserLevel } from './agent';

export interface Curriculum {
  id: string; // uuid
  name: string;
  description: string;
  target_level: UserLevel;
  created_at: string; // timestamp
}

export interface Lesson {
  id: string; // uuid
  curriculum_id: string; // uuid
  order: number;
  title: string;
  objective: string;
  created_at: string; // timestamp
}

export interface LessonItem {
  id: string; // uuid
  lesson_id: string; // uuid
  order: number;
  content_arabic: string;
  content_english: string;
  content_transliteration?: string;
  created_at: string; // timestamp
}

export interface UserEnrollment {
  id: string; // uuid
  user_id: string; // uuid
  curriculum_id: string; // uuid
  status: 'in-progress' | 'completed';
  enrolled_at: string; // timestamp
  completed_at?: string; // timestamp
}

export interface UserLessonProgress {
  id: string; // uuid
  enrollment_id: string; // uuid
  lesson_id: string; // uuid
  status: 'not-started' | 'in-progress' | 'completed';
  best_score?: number;
  attempts: number;
  last_attempted_at?: string; // timestamp
}
