"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceRecorderProps {
  onResult?: (result: string) => void;
  onRecordingChange: (isRecording: boolean) => void;
  onRecordingComplete?: (blob: Blob) => void;
  expectedText?: string;
  language?: string;
}

export default function VoiceRecorder({
  onResult,
  onRecordingChange,
  onRecordingComplete,
  expectedText,
  language = 'ar-SA'
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize SpeechRecognition once if available and requested
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition && (onResult || expectedText)) {
        const recog = new SpeechRecognition();
        recog.lang = language;
        recog.interimResults = false;
        recog.maxAlternatives = 1;

        recog.onresult = (event: any) => {
          try {
            const transcript = event.results?.[0]?.[0]?.transcript || '';
            if (onResult) onResult(transcript);
            // If expectedText provided, we can log match/mismatch (non-blocking)
            if (expectedText) {
              if (transcript.toLowerCase().includes(expectedText.toLowerCase())) {
                console.log('Pronunciation match:', transcript);

                console.log('Pronunciation mismatch:', { transcript, expectedText });
              }
            }
          } catch (e) {
            console.error('onresult handler error', e);
          } finally {
            setIsRecording(false);
            onRecordingChange(false);
          }
        };

        recog.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error || event);
          setError(`Speech recognition failed: ${event.error || 'unknown'}`);
          setIsRecording(false);
          onRecordingChange(false);
        };

        recog.onend = () => {
          setIsRecording(false);
          onRecordingChange(false);
        };

        recognitionRef.current = recog;
      } else if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (onResult || expectedText)) {
        setError('Speech recognition is not supported in this browser.');
      }
    } catch (err) {
      console.error('SpeechRecognition init error', err);
      setError('Failed to initialize speech recognition.');
    }

    // Initialize MediaRecorder if onRecordingComplete is provided
    if (onRecordingComplete) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          streamRef.current = stream;
          try {
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e: BlobEvent) => {
              if (e.data && e.data.size > 0) {
                chunksRef.current.push(e.data);
              }
            };
            recorder.onstop = () => {
              try {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(blob);
              } catch (e) {
                console.error('Error creating audio blob', e);
              } finally {
                chunksRef.current = [];
              }
            };
            recorderRef.current = recorder;
          } catch (e) {
            console.error('MediaRecorder init error', e);
            setError('Failed to initialize audio recorder.');
          }
        })
        .catch((err) => {
          console.error('getUserMedia error', err);
          setError('Failed to access microphone. Please check permissions.');
        });
    }

    return () => {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.onresult = null; recognitionRef.current.onend = null; recognitionRef.current.onerror = null; } catch {}
          try { recognitionRef.current.stop(); } catch {}
          recognitionRef.current = null;
        }
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          try { recorderRef.current.stop(); } catch {}
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      } catch (e) {
        console.error('cleanup error', e);
      }
    };
  }, [language, onResult, onRecordingChange, onRecordingComplete, expectedText]);

  const startRecording = () => {
    setError(null);
    try {
      if (recognitionRef.current && recognitionRef.current.start) {
        recognitionRef.current.start();
      }
      if (recorderRef.current) {
        chunksRef.current = [];
        recorderRef.current.start();
      }
      setIsRecording(true);
      onRecordingChange(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
      setIsRecording(false);
      onRecordingChange(false);
    }
  };

  const stopRecording = () => {
    try {
      if (recognitionRef.current && recognitionRef.current.stop) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch {}
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
    } finally {
      setIsRecording(false);
      onRecordingChange(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <p className="font-semibold">Error: {error}</p>
        <p className="text-sm mt-2">Please try text input or use a supported browser (e.g., Chrome).</p>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`p-2 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <span className="text-sm text-gray-600 font-arabic">
        {isRecording ? 'جارِ التسجيل...' : 'اضغط لتسجيل هدفك'}
      </span>
    </div>
  );
}
+
*** End Patch