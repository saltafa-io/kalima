'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Play, Pause, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  expectedText?: string;
}

interface AnalysisResult {
  success: boolean;
  data?: {
    transcribed_text: string;
    expected_text: string;
    pronunciation_score: number;
    confidence: number;
    feedback: string;
    phoneme_analysis: {
      total_phonemes: number;
      correct_phonemes: number;
      problem_areas: string[];
    };
  };
  error?: string;
}

export default function VoiceRecorder({ onRecordingComplete, expectedText }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
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

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        onRecordingComplete(blob);
        
        // Automatically analyze the recording
        await analyzeRecording(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      setAnalysisResult(null); // Clear previous results

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check your browser permissions.');
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

  const analyzeRecording = useCallback(async (blob: Blob) => {
    if (!blob || !expectedText) return;
    
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', blob);
      formData.append('expectedText', expectedText);
      
      const response = await fetch('/api/speech', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      setAnalysisResult(result);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult({
        success: false,
        error: 'Failed to analyze recording. Please try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [expectedText]);

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

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setAnalysisResult(null);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-blue-600';
    if (score >= 0.7) return 'text-yellow-600';
    if (score >= 0.6) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 0.9) return 'bg-green-50 border-green-200';
    if (score >= 0.8) return 'bg-blue-50 border-blue-200';
    if (score >= 0.7) return 'bg-yellow-50 border-yellow-200';
    if (score >= 0.6) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
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
          disabled={isAnalyzing}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
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
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Analyzing pronunciation...</span>
              </div>
            </div>
          ) : audioBlob ? (
            <div className="flex flex-col items-center space-y-2">
              <span className="text-sm text-green-600">
                Recording complete!
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={playRecording}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Play</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetRecording}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-600">
              Click to start recording
            </span>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="w-full mt-4">
            {analysisResult.success && analysisResult.data ? (
              <div className={`p-4 rounded-lg border ${getScoreBackground(analysisResult.data.pronunciation_score)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">Pronunciation Analysis</h4>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                
                {/* Score */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Score:</span>
                    <span className={`font-bold ${getScoreColor(analysisResult.data.pronunciation_score)}`}>
                      {Math.round(analysisResult.data.pronunciation_score * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        analysisResult.data.pronunciation_score >= 0.9 ? 'bg-green-500' :
                        analysisResult.data.pronunciation_score >= 0.8 ? 'bg-blue-500' :
                        analysisResult.data.pronunciation_score >= 0.7 ? 'bg-yellow-500' :
                        analysisResult.data.pronunciation_score >= 0.6 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analysisResult.data.pronunciation_score * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                  <p className="text-sm text-gray-600">{analysisResult.data.feedback}</p>
                </div>

                {/* What you said */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">What you said:</p>
                  <p className="text-lg font-arabic text-blue-800" dir="rtl">
                    {analysisResult.data.transcribed_text}
                  </p>
                </div>

                {/* Phoneme Analysis */}
                <div className="text-xs text-gray-500">
                  <p>Phonemes: {analysisResult.data.phoneme_analysis.correct_phonemes}/{analysisResult.data.phoneme_analysis.total_phonemes} correct</p>
                  <p>Confidence: {Math.round(analysisResult.data.confidence * 100)}%</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">
                    {analysisResult.error || 'Analysis failed. Please try again.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center max-w-xs">
          {isRecording ? (
            "Click the red button to stop recording"
          ) : isAnalyzing ? (
            "Please wait while we analyze your pronunciation..."
          ) : (
            "Click the microphone and speak clearly. Make sure you're in a quiet environment."
          )}
        </div>
      </div>
    </div>
  );
}