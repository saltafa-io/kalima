'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import VoiceRecorder from '../audio/VoiceRecorder';

interface EnrollmentProps {
  userId: string;
}

export default function Enrollment({ userId }: EnrollmentProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Check for SpeechRecognition support
  const isSpeechSupported = typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, email, level, goals')
          .eq('id', userId)
          .single();
        if (error) {
          console.error('Error fetching profile:', error);
          setError(`Failed to fetch profile: ${error.message}`);
          return;
        }
        if (data) {
          setName(data.name || '');
          setEmail(data.email || '');
          setLevel(data.level || '');
          setGoals(data.goals || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred while fetching your profile.');
      }
    };

    fetchProfile();
  }, [userId]);

  const handleVoiceInput = (result: string) => {
    if (isRecording) {
      setNewGoal(result);
    }
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, email, level, goals })
        .eq('id', userId);
      if (error) {
        console.error('Error updating profile:', error);
        setError(`Failed to save profile: ${error.message}`);
        return;
      }

      const lessons = encodeURIComponent(JSON.stringify(['مرحبا', 'شكرا']));
      router.push(`/learn?lessons=${lessons}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while saving your profile.');
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-semibold">Error: {error}</p>
          <p className="text-sm mt-2">Please try again or contact support. Check the console for more details.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-arabic"
            placeholder="أدخل اسمك"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-arabic"
            placeholder="أدخل بريدك الإلكتروني"
            required
          />
        </div>
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700">
            Arabic Level
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-arabic"
            required
          >
            <option value="" disabled>Select your level</option>
            <option value="beginner">Beginner (مبتدئ)</option>
            <option value="intermediate">Intermediate (متوسط)</option>
            <option value="advanced">Advanced (متقدم)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Learning Goals
          </label>
          {isSpeechSupported && (
            <VoiceRecorder
              onResult={handleVoiceInput}
              onRecordingChange={setIsRecording}
              language="ar-SA"
            />
          )}
          <div className="mt-2 flex space-x-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-arabic"
              placeholder="أدخل هدفًا جديدًا"
            />
            <button
              type="button"
              onClick={handleAddGoal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-arabic"
            >
              إضافة
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {goals.map((goal, index) => (
              <li key={index} className="text-gray-700 font-arabic">{goal}</li>
            ))}
          </ul>
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md hover:from-orange-600 hover:to-red-600 font-arabic"
        >
          Submit
        </button>
      </form>
    </div>
  );
}