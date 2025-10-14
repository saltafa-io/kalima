import { NextRequest, NextResponse } from 'next/server';
import { simulateTranscription, calculatePronunciationScore, generateFeedback } from '../../../lib/analysis/pronunciation';
import { transcribeAudio } from '../../../lib/ai/openai';

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
      
      // Call the real Whisper STT service
      const transcribedText = await transcribeAudio(audioFile);

      const pronunciationScore = calculatePronunciationScore(
        transcribedText,
        expectedText
      );

      return NextResponse.json({
        success: true,
        data: {
          transcribed_text: transcribedText,
          expected_text: expectedText,
          pronunciation_score: pronunciationScore,
          // Confidence and phoneme analysis are not provided by Whisper's text-only output
          confidence: null, 
          feedback: generateFeedback(pronunciationScore),
          phoneme_analysis: null,
          mode: 'real'
        }
      });
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to process audio', details: errorMessage },
      { status: 500 }
    );
  }
}