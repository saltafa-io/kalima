"use client";

import React, { useState } from 'react';
import VoiceRecorder from '../../components/audio/VoiceRecorder';

type Turn = { speaker: 'user' | 'agent'; text: string };

export default function DemoPage() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Turn[]>([]);

  const sendTurn = async (text: string) => {
    setError(null);
    setLoading(true);
    try {
      // append user turn
      setHistory((h) => [...h, { speaker: 'user', text }]);

      const form = new FormData();
      form.append('transcript', text || '');

      const res = await fetch('/api/demo', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo API failed');

      setHistory((h) => [...h, { speaker: 'agent', text: data.reply }]);
      setTranscript('');
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingComplete = async (blob: Blob) => {
    // For the mock, we do not send audio, only the recognized transcript
    await sendTurn(transcript);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-4">AI Agent Demo</h1>
        <p className="text-sm text-gray-600 mb-4">Practice a short conversation with the AI agent. This demo uses a mock backend response.</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Transcript (type or use the mic)</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="اكتب أو سجل مقطعًا صوتيًا"
            />
            <button
              onClick={() => sendTurn(transcript)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Send
            </button>
          </div>
        </div>

        <div className="mb-4">
          <VoiceRecorder
            onResult={(t) => setTranscript(t)}
            onRecordingChange={() => {}}
            onRecordingComplete={handleRecordingComplete}
            language="ar-SA"
          />
        </div>

        {loading && <p className="text-sm text-gray-500">Processing...</p>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="mt-6 space-y-3">
          {history.map((turn, i) => (
            <div key={i} className={`p-3 rounded ${turn.speaker === 'user' ? 'bg-blue-50 self-end' : 'bg-gray-100'}`}>
              <div className={`text-sm ${turn.speaker === 'user' ? 'text-blue-800' : 'text-gray-800'}`}>{turn.text}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
