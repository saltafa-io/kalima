import OpenAI from 'openai';
import { Retrier } from '@humanwhocodes/retry';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateResponse(
  systemPrompt: string,
  conversationHistory: ChatMessage[],
  temperature: number = 0.7
): Promise<string> {
  // Retry on network errors or 5xx server errors from OpenAI
  const retrier = new Retrier((err: any) => {
    // Don't retry on 4xx client errors
    if (err instanceof OpenAI.APIError && err.status && err.status >= 400 && err.status < 500) {
      return false;
    }
    // Retry on other errors (network, 5xx, etc.)
    return true;
  });

  try {
    return await retrier.retry(async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4-1106-preview", // Using latest GPT-4 with better Arabic support
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory
        ],
        temperature: temperature,
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      // Return the raw string content
      return response.choices[0].message.content || '{}';
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Convert blob to file
    const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "ar",
      response_format: "verbose_json", // Change this to get detailed output
      timestamp_granularities: ["word"] // Request word-level timestamps
    });

    return transcription.text; // For now, we still return the full text
  } catch (error) {
    console.error('Whisper API error:', error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function analyzePromptStructure(prompt: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: "Analyze the given Arabic learning prompt and break it down into grammatical components, difficulty level, and cultural context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Prompt analysis error:', error);
    throw new Error(`Failed to analyze prompt: ${error instanceof Error ? error.message : String(error)}`);
  }
}
