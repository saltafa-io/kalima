import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ArabicAIAgent } from '../../../lib/ai/agent';
import { AgentConfig, ConversationContext } from '../../../types/agent';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 1. Authenticate the user
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Get data from the client
    const formData = await request.formData();
    const userInput = formData.get('input');
    const audioBlob = formData.get('audio');
    const enrollmentId = formData.get('enrollmentId');
    const lessonId = formData.get('lessonId');

    if (typeof userInput !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const enrollmentIdStr = typeof enrollmentId === 'string' ? enrollmentId : null;
    const lessonIdStr = typeof lessonId === 'string' ? lessonId : null;

    // 3. Fetch lesson details to build the context
    let lessonTopic: string | undefined;
    let focusArea: string | undefined;

    if (lessonIdStr) {
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('title, objective')
        .eq('id', lessonIdStr)
        .single();
      
      if (lessonError) {
        console.warn(`Could not fetch lesson ${lessonIdStr}:`, lessonError.message);
      } else if (lessonData) {
        lessonTopic = lessonData.title;
        focusArea = lessonData.objective;
      }
    }

    // 4. Create the initial context for the agent
    const initialContext: ConversationContext = {
      userLevel: 'beginner', // This could be fetched from the user's profile
      enrollmentId: enrollmentIdStr ?? undefined,
      curriculumId: undefined, // Could be fetched if needed
      lessonId: lessonIdStr ?? undefined,
      lessonTopic: lessonTopic,
      focusArea: focusArea,
      previousExchanges: [], // For a real app, you'd load this from a DB
    };

    // 5. Instantiate and run the agent
    const agentConfig: AgentConfig = {
      personality: { role: 'conversationPartner', teachingStyle: 'encouraging', traits: ['patient', 'clear'] },
      contextWindow: 5,
      temperature: 0.7,
      maxResponseTokens: 250,
      responseTimeoutMs: 10000,
    };

    const agent = new ArabicAIAgent(agentConfig, initialContext);
    const agentResponse = await agent.processUserInput(userInput, audioBlob instanceof Blob ? audioBlob : undefined);

    if (agentResponse.error) {
      throw new Error(agentResponse.error);
    }

    return NextResponse.json(agentResponse);

  } catch (error) {
    console.error('Error in agent API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to get response from agent', details: errorMessage },
      { status: 500 }
    );
  }
}