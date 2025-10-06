import { NextRequest, NextResponse } from 'next/server';

const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/webm',
  'audio/ogg',
  'audio/x-m4a',
  'audio/m4a'
]);

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();

    const audioFile = formData.get('audio') as File | null;
    const expectedTextVal = formData.get('expectedText');
    const modeVal = (formData.get('mode') as string) || 'mock';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided (field name `audio`)' }, { status: 400 });
    }

    if (!(audioFile instanceof File)) {
      return NextResponse.json({ error: 'Uploaded audio is not a valid File' }, { status: 400 });
    }

    if (typeof audioFile.size === 'number' && audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: `Audio file too large. Max ${MAX_AUDIO_BYTES} bytes allowed.` }, { status: 413 });
    }

    const mime = (audioFile.type || '').toLowerCase();
    if (mime && !ALLOWED_MIME.has(mime)) {
      return NextResponse.json({ error: `Unsupported audio mime type: ${mime}` }, { status: 415 });
    }

    const expectedText = typeof expectedTextVal === 'string' ? expectedTextVal : '';

    // Mode: 'mock' (default) or 'real' (call external STT/LLM). If real mode is requested but
    // we don't have credentials, return 501 to indicate not implemented/available.
    const mode = (modeVal || 'mock').toString();
    if (mode === 'real') {
      // Example: require OPENAI_API_KEY or WHISPER_API_KEY to be present in environment
      if (!process.env.OPENAI_API_KEY && !process.env.WHISPER_API_KEY) {
        return NextResponse.json({ error: 'Real transcription mode requested but server is not configured (missing API key)' }, { status: 501 });
      }
      // TODO: call external STT provider here (Whisper/OpenAI/other)
      return NextResponse.json({ error: 'Real transcription mode not yet implemented on server' }, { status: 501 });
    }

    // For now, mock transcription path
    const mockTranscription = simulateTranscription(expectedText);

    const pronunciationScore = calculatePronunciationScore(
      mockTranscription.transcribed,
      expectedText
    );

    return NextResponse.json({
      success: true,
      data: {
        transcribed_text: mockTranscription.transcribed,
        expected_text: expectedText,
        pronunciation_score: pronunciationScore,
        confidence: mockTranscription.confidence,
        feedback: generateFeedback(pronunciationScore),
        phoneme_analysis: mockTranscription.phonemes,
        mode: 'mock'
      }
    });

  } catch (error) {
    console.error('Speech processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio', details: (error as any)?.message || String(error) }, 
      { status: 500 }
    );
  }
}

// Simulate transcription (replace with real API later)
function simulateTranscription(expectedText: string) {
  const variations: { [key: string]: string[] } = {
    'مرحبا': ['مرحبا', 'مرحبا', 'مرحباً', 'مرحبة'],
    'شكرا': ['شكرا', 'شكراً', 'شكرة'],
    'كيف الحال': ['كيف الحال', 'كيف الحالة', 'كيف حالك']
  };

  const possibleTranscriptions = variations[expectedText] || [expectedText];
  const randomTranscription = possibleTranscriptions[
    Math.floor(Math.random() * possibleTranscriptions.length)
  ];

  return {
    transcribed: randomTranscription,
    confidence: 0.85 + Math.random() * 0.1, // Random confidence 85-95%
    phonemes: generatePhonemeAnalysis(expectedText, randomTranscription)
  };
}

// Simple pronunciation scoring
function calculatePronunciationScore(transcribed: string, expected: string): number {
  if (transcribed === expected) return 0.95;
  
  // Simple similarity check (we'll improve this with better algorithms)
  const similarity = calculateStringSimilarity(transcribed, expected);
  return Math.max(0.3, similarity);
}

// Calculate string similarity (simple version)
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Generate feedback based on score
function generateFeedback(score: number): string {
  if (score >= 0.9) return 'Excellent pronunciation! 🎉';
  if (score >= 0.8) return 'Very good! Small improvements possible. 👍';
  if (score >= 0.7) return 'Good effort! Keep practicing. 😊';
  if (score >= 0.6) return 'Not bad! Focus on clarity. 🤔';
  return 'Keep trying! Listen to the pronunciation guide. 💪';
}

// Generate phoneme analysis (simplified)
function generatePhonemeAnalysis(expected: string, transcribed: string) {
  return {
    total_phonemes: expected.length,
    correct_phonemes: Math.floor(expected.length * calculateStringSimilarity(expected, transcribed)),
    problem_areas: transcribed !== expected ? ['vowel_sounds'] : []
  };
}