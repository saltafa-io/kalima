'use client';

import LandingPage from '../components/LandingPage';
import VoiceRecorder from '../components/audio/VoiceRecorder';
import { useState } from 'react';

export default function Home() {
  const [showApp, setShowApp] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    console.log('Recording completed:', blob);
    // Later we'll send this to speech recognition API
  };

  // If user wants to access the app, show the existing functionality
  if (showApp) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          {/* Back to Landing */}
          <button
            onClick={() => setShowApp(false)}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Home
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 font-arabic">
              كليمة - Kalima
            </h1>
            <p className="text-gray-600">
              Learn Arabic pronunciation with AI-powered voice feedback
            </p>
          </div>

          {/* Sample Arabic Text for Practice */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Practice Lesson 1</h2>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Practice saying:</p>
                <p className="text-3xl font-bold text-blue-800 mb-2 font-arabic" dir="rtl">
                  مرحبا
                </p>
                <p className="text-gray-600 text-sm">
                  (Marhaba - Hello)
                </p>
              </div>
            </div>

            {/* Voice Recorder Component */}
            <VoiceRecorder 
              onRecordingComplete={handleRecordingComplete}
              expectedText="مرحبا"
            />

            {/* Recording Status */}
            {audioBlob && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-center">
                  ✅ Recording saved! Size: {Math.round(audioBlob.size / 1024)}KB
                </p>
                <p className="text-sm text-green-600 text-center mt-2">
                  (Next: We'll add speech recognition to analyze your pronunciation)
                </p>
              </div>
            )}
          </div>

          {/* Development Progress */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                🚀 Development Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm">Next.js project setup complete</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm">Voice recording component working</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm">Arabic text display with proper fonts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm">Beautiful landing page created</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">🔄</span>
                  <span className="text-sm">Next: Add speech recognition API</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">⏳</span>
                  <span className="text-sm text-gray-500">Later: Add pronunciation scoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">⏳</span>
                  <span className="text-sm text-gray-500">Later: Add lesson management</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show landing page by default
  return <LandingPage onGetStarted={() => setShowApp(true)} />;
}