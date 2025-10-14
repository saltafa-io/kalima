import { 
  AgentConfig,
  ConversationContext,
  TeachingAction,
  AgentResponse
} from '../../types/agent';
import { generateResponse, ChatMessage } from './openai';
import { getNextLesson } from '../services/curriculumService';

export class ArabicAIAgent {
  private config: AgentConfig;
  private context: ConversationContext;

  constructor(config: AgentConfig, initialContext: ConversationContext) {
    this.config = config;
    this.context = initialContext;
  }

  private async getSystemPrompt(): Promise<string> {
    const { role, teachingStyle, traits } = this.config.personality;
    const { userLevel, lessonTopic, focusArea } = this.context;

    return `You are an Arabic language ${role}, teaching with a ${teachingStyle} style.
Your traits: ${traits.join(', ')}.
The student's level is: ${userLevel}.
The current lesson is "${lessonTopic || 'General Conversation'}".
The learning objective for this lesson is: "${focusArea || 'Practice speaking freely'}".

Your responses should:
1. Be culturally appropriate and engaging
2. Use Modern Standard Arabic (MSA) unless specifically teaching dialects
3. Include transliteration when introducing new words
4. Provide gentle corrections for mistakes
5. Maintain conversation flow while teaching
6. Adapt to the student's level and progress

Respond in this JSON structure:
{
  "arabic": "Arabic response",
  "translation": "English translation",
  "teaching": [{
    "type": "explain|correct|encourage|challenge|suggest",
    "content": "Teaching point"
  }],
  "nextPrompts": ["Suggested responses for student"]
}`;
  }

  private async prepareConversationHistory(): Promise<ChatMessage[]> {
    const messages: ChatMessage[] = [];
    this.context.previousExchanges
      .slice(-this.config.contextWindow)
      .forEach(exchange => {
        messages.push({ role: 'user', content: exchange.userInput.text });
        // The agentResponse text is the raw JSON string from the assistant
        messages.push({ role: 'assistant', content: exchange.agentResponse.rawResponse || '' });
      });
    return messages;
  }

  private async callLLM(
    systemPrompt: string, 
    conversationHistory: ChatMessage[], 
    userInput: string
  ): Promise<{ parsed: { arabic: string; teaching: TeachingAction[]; nextPrompts: string[] }; raw: string }> {
    // Combine history with the new user input
    const messages: ChatMessage[] = [...conversationHistory, { role: 'user', content: userInput }];

    // Generate response using OpenAI
    const response = await generateResponse(
      systemPrompt,
      messages,
      this.config.temperature
    );

    // Return both the parsed JSON and the raw string for history
    return {
      parsed: JSON.parse(response || '{}'),
      raw: response,
    };
  }

  async processUserInput(
    input: string, 
    audioBlob?: Blob
  ): Promise<AgentResponse> {
    try {
      // Get system prompt and conversation history
      const systemPrompt = await this.getSystemPrompt();
      const conversationHistory = await this.prepareConversationHistory();

      // Call LLM
      const llmResponse = await this.callLLM(
        systemPrompt,
        conversationHistory,
        input,
      );
      const llmJson = llmResponse.parsed;
      // Process audio if provided
      let pronunciationFeedback;
      if (audioBlob) {
        pronunciationFeedback = await this.analyzePronunciation(
          audioBlob,
          llmJson.arabic
        );
      }

      // Update conversation context
      this.context.previousExchanges.push({
        userInput: {
          text: input,
          audio: audioBlob,
          timestamp: Date.now()
        },
        agentResponse: {
          text: llmJson.arabic,
          rawResponse: llmResponse.raw, // Store the raw JSON response for history
          feedback: llmJson.teaching?.[0]?.content,
          corrections: pronunciationFeedback?.corrections,
          nextPrompts: llmJson.nextPrompts,
          timestamp: Date.now()
        }
      });

      // Prepare response
      const response: AgentResponse = {
        response: llmJson.arabic,
        teaching: llmJson.teaching,
        suggestedTopics: this.generateTopicSuggestions(),
        pronunciationFeedback,
        nextSteps: await this.determineNextSteps()
      };

      return response;

    } catch (error) {
      console.error('Agent processing error:', error);
      return {
        response: 'عفواً، حدث خطأ. (Sorry, an error occurred.)',
        teaching: [{
          type: 'explain',
          content: 'There was an error processing your input. Please try again.'
        }],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async analyzePronunciation(
    audioBlob: Blob, 
    expectedText: string
  ): Promise<AgentResponse['pronunciationFeedback']> {
    // 1. Prepare the audio data for the speech API
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('expectedText', expectedText);
    formData.append('mode', 'real'); // Use the real Whisper STT

    // 2. Call your existing speech API to get the transcription and score
    // This assumes your app is running on localhost:3000. 
    // In production, this URL should be the absolute URL of your deployment.
    const speechApiUrl = new URL('/api/speech', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    const speechResponse = await fetch(speechApiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!speechResponse.ok) {
      console.error('Speech API error:', await speechResponse.text());
      return { score: 0, corrections: [], tips: ['Could not analyze audio.'] };
    }

    const speechData = await speechResponse.json();
    const { transcribed_text, pronunciation_score } = speechData.data;

    // 3. If transcription matches, return positive feedback immediately
    if (pronunciation_score >= 0.95) {
      return {
        score: pronunciation_score,
        corrections: [],
        tips: ['Excellent pronunciation! Perfect. 🎉']
      };
    }

    // 4. If there's a difference, ask the LLM for qualitative feedback
    const feedbackPrompt = `As an Arabic pronunciation coach, a student was asked to say: "${expectedText}". They actually said: "${transcribed_text}". Provide short, actionable feedback. Identify the main error and give a tip to fix it. Respond in JSON like this: { "corrections": ["'said' -> 'expected'"], "tips": ["Your tip here."] }`;
    
    // We can reuse the `generateResponse` function for this specialized query.
    const feedbackJsonString = await generateResponse(feedbackPrompt, [], 0.5);
    const feedback = JSON.parse(feedbackJsonString);

    return { score: pronunciation_score, ...feedback };
  }

  private generateTopicSuggestions(): string[] {
    // With curriculum context, this could suggest related past or future lessons.
    // For now, we keep it generic if no lesson is active.
    if (this.context.lessonTopic) {
      // In a real implementation, you'd fetch related topics from your DB.
      return [`More about ${this.context.lessonTopic}`, 'Review previous lesson', 'Practice a different topic'];
    }
    return ['Greetings', 'Family', 'Food', 'Travel'];
  }

  private async determineNextSteps() {
    // With curriculum context, this can suggest the next lesson in the sequence.
    // This requires the enrollmentId, which we don't have in the agent context yet.
    // This logic should be called from a place that has the enrollmentId.
    // For demonstration, let's assume we could get it.
    const enrollmentId = this.context.enrollmentId; // We'll need to add this to the context
    if (enrollmentId) {
      const nextLesson = await getNextLesson(enrollmentId);
      if (nextLesson) {
        return [{
          topic: nextLesson.title,
          difficulty: 1, // This could be dynamic in the future
          type: 'lesson'
        }];
      }
    }
    return [];
  }

  // Methods for adjusting agent behavior
  public updateConfig(newConfig: Partial<AgentConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public updateContext(newContext: Partial<ConversationContext>) {
    this.context = { ...this.context, ...newContext };
  }
}