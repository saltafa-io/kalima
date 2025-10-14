"use client";

import React, { useState } from 'react';
import { AgentResponse } from '../../types/agent';
import VoiceRecorder from '../../components/audio/VoiceRecorder';
import PronunciationFeedback from '../../components/feedback/PronunciationFeedback';

type DemoTurn = {
  user: { text: string };
  agent: AgentResponse;
};

export default function DemoPage() {
  const [inputText, setInputText] = useState('');
  const [lastAudio, setLastAudio] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DemoTurn[]>([]);

  const sendTurn = async (text: string, audio?: Blob | null) => {
    if (!text && !audio) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('input', text);
      if (audio) {
        formData.append('audio', audio, 'recording.webm');
      }
      
      // Call the real agent API
      const res = await fetch('/api/agent', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Agent API request failed');
      }

      // Add the full exchange to history
      setHistory((h) => [
        ...h,
        {
          user: { text },
          agent: data,
        },
      ]);
      setInputText('');
      setLastAudio(null);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRecordingComplete = async (blob: Blob) => {
    setLastAudio(blob);
    // The user can now send the turn with the recorded audio
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
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="اكتب أو سجل مقطعًا صوتيًا"
            />
            <button
              onClick={() => sendTurn(inputText, lastAudio)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Send
            </button>
          </div>
        </div>

        <div className="mb-4">
          <VoiceRecorder
            onResult={(t) => setInputText(t)}
            onRecordingChange={() => {}}
            onRecordingComplete={handleRecordingComplete}
            language="ar-SA"
          />
        </div>

        {loading && <p className="text-sm text-gray-500">Processing...</p>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="mt-6 space-y-3">
          {history.map((turn, i) => (
            <React.Fragment key={i}>
              {/* User's Turn */}
              <div className="p-3 rounded bg-blue-50 self-end text-right">
                <div className="text-sm text-blue-800">{turn.user.text}</div>
              </div>
              {/* Agent's Turn */}
              <div className="p-3 rounded bg-gray-100">
                <div className="text-sm text-gray-800">{turn.agent.response}</div>
                {turn.agent.pronunciationFeedback && (
                  <PronunciationFeedback feedback={turn.agent.pronunciationFeedback} />
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </main>
  );
}
