'use client';

import React, { useState, useEffect } from 'react';
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
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && (onResult || expectedText)) {
        const recog = new SpeechRecognition();
        recog.lang = language;
        recog.interimResults = false;
        recog.maxAlternatives = 1;

        recog.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          if (onResult) {
            onResult(transcript);
          }
          if (expectedText && transcript.toLowerCase().includes(expectedText.toLowerCase())) {
            console.log('Pronunciation match:', transcript);
          } else if (expectedText) {
            console.log('Pronunciation mismatch:', { transcript, expectedText });
          }
          setIsRecording(false);
          onRecordingChange(false);
        };

        recog.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition failed: ${event.error}`);
          setIsRecording(false);
          onRecordingChange(false);
        };

        recog.onend = () => {
          setIsRecording(false);
          onRecordingChange(false);
        };

        setRecognition(recog);
      } else if (!SpeechRecognition && (onResult || expectedText)) {
        setError('Speech recognition is not supported in this browser.');
      }

      // Initialize MediaRecorder for audio blobs
      if (onRecordingComplete) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                setAudioChunks((chunks) => [...chunks, event.data]);
              }
            };
            recorder.onstop = () => {
              const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              onRecordingComplete(audioBlob);
              setAudioChunks([]);
            };
            setMediaRecorder(recorder);
          })
          .catch((err) => {
            console.error('MediaRecorder error:', err);
            setError('Failed to access microphone. Please check permissions.');
          });
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    };
  }, [language, onResult, onRecordingChange, onRecordingComplete, expectedText]);

  const startRecording = () => {
    if ((recognition || mediaRecorder) && !isRecording) {
      try {
        if (recognition) {
          recognition.start();
        }
        if (mediaRecorder) {
          setAudioChunks([]);
          mediaRecorder.start();
        }
        setIsRecording(true);
        setError(null);
        onRecordingChange(true);
      } catch (err) {
        console.error('Error starting recording:', err);
        setError('Failed to start recording. Please try again.');
        setIsRecording(false);
        onRecordingChange(false);
      }
    }
  };

  const stopRecording = () => {
    if ((recognition || mediaRecorder) && isRecording) {
      if (recognition) {
        recognition.stop();
      }
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
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
        className={`p-2 rounded-full ${
          isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <span className="text-sm text-gray-600 font-arabic">
        {isRecording ? 'جارٍ التسجيل...' : 'اضغط لتسجيل هدفك'}
      </span>
    </div>
  );
}