// Types for AI Agent system

export type AgentRole = 'conversationPartner' | 'grammarTutor' | 'culturalGuide' | 'pronunciationCoach' | 'progressMentor';

export type TeachingStyle = 'casual' | 'formal' | 'encouraging' | 'challenging';

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

export interface AgentPersonality {
  role: AgentRole;
  teachingStyle: TeachingStyle;
  traits: string[];
}

export interface ConversationContext {
  userLevel: UserLevel;
  curriculumId?: string; // From user_enrollments
  enrollmentId?: string; // From user_enrollments
  lessonId?: string;     // From user_lesson_progress
  lessonTopic?: string;
  focusArea?: string; // The lesson's objective
  previousExchanges: ConversationExchange[];
  userGoals?: string[];
  culturalContext?: string;
}

export interface ConversationExchange {
  userInput: {
    text: string;
    audio?: Blob;
    timestamp: number;
  };
  agentResponse: {
    text: string;
    rawResponse?: string;
    feedback?: string;
    corrections?: string[];
    nextPrompts?: string[];
    timestamp: number;
  };
}

export interface TeachingAction {
  type: 'explain' | 'correct' | 'encourage' | 'challenge' | 'suggest';
  content: string;
  context?: string;
}

export interface AgentConfig {
  personality: AgentPersonality;
  contextWindow: number; // Number of previous exchanges to consider
  temperature: number; // LLM creativity setting
  maxResponseTokens: number;
  responseTimeoutMs: number;
}

export interface LearningProgress {
  strengths: string[];
  areasForImprovement: string[];
  recentTopics: string[];
  skillLevels: Record<string, number>; // e.g., {pronunciation: 0.8, grammar: 0.6}
}

// Response from the AI agent API
export interface AgentResponse {
  response: string;
  teaching: TeachingAction[];
  suggestedTopics?: string[];
  pronunciationFeedback?: {
    score: number;
    corrections: string[];
    tips: string[];
  };
  nextSteps?: {
    topic: string;
    difficulty: number;
    type: string;
  }[];
  error?: string;
}