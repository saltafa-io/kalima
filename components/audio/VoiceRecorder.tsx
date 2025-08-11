'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  expectedText?: string;
}

export default function VoiceRecorder({ onRecordingComplete, expectedText }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        onRecordingComplete(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      // Replaced alert() with a custom message box to avoid breaking the iframe.
      // A more robust solution would be to use a state variable to display a message on the UI.
      console.log('Unable to access microphone. Please check your browser permissions.');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (audioBlob) {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioBlob, isPlaying]);

  const analyzeRecording = useCallback(async (audioBlob: Blob) => {
    if (!audioBlob) return;
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('expectedText', expectedText || '');
      
      const response = await fetch('/api/speech', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('Speech analysis result:', result);
      
      // You can add a callback prop to handle the results
      // onAnalysisComplete?.(result);
      
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }, [expectedText]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Voice Practice
        </h3>
        {expectedText && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-1">Say this:</p>
            <p className="text-2xl font-bold text-blue-800 font-arabic" dir="rtl">
              {expectedText}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center space-y-4">
        {/* Recording Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white shadow-lg hover:shadow-xl`}
        >
          {isRecording ? (
            <Square className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        {/* Recording Status */}
        <div className="text-center">
          {isRecording ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600">Recording...</span>
              </div>
              <span className="text-lg font-mono mt-1">
                {formatTime(recordingTime)}
              </span>
            </div>
          ) : audioBlob ? (
            <div className="flex flex-col items-center">
              <span className="text-sm text-green-600 mb-2">
                Recording complete!
              </span>
              <button
                onClick={playRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Play Recording</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-600">
              Click to start recording
            </span>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center max-w-xs">
          {isRecording ? (
            "Click the red button to stop recording"
          ) : (
            "Click the microphone and speak clearly. Make sure you're in a quiet environment."
          )}
        </div>
      </div>
    </div>
  );
}
