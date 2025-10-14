'use client';

import React, { useState, useEffect, FormEvent } from 'react';
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
  const [isSaving, setIsSaving] = useState(false);

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
    setNewGoal(result);
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      if (!goals.includes(newGoal.trim())) {
        setGoals([...goals, newGoal.trim()]);
      }
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (indexToRemove: number) => {
    setGoals(goals.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, email, level, goals })
        .eq('id', userId);
      if (error) {
        throw error;
      }

      // Redirect to the curricula page to choose a course
      router.push('/curricula');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred while saving your profile.');
      setIsSaving(false);
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
          <ul className="mt-2 space-y-2">
            {goals.map((goal, index) => (
              <li key={`${goal}-${index}`} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                <span className="text-gray-700 font-arabic">{goal}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal(index)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Remove goal: ${goal}`}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md hover:from-orange-600 hover:to-red-600 font-arabic disabled:bg-gray-400 disabled:from-gray-400"
        >
          {isSaving ? 'Saving...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}