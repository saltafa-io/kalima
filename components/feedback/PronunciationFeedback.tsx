'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PronunciationFeedbackProps {
  feedback: {
    score: number;
    corrections: string[];
    tips: string[];
  };
}

const PronunciationFeedback: React.FC<PronunciationFeedbackProps> = ({ feedback }) => {
  const { score, corrections, tips } = feedback;

  const getScoreColor = (s: number) => {
    if (s >= 0.9) return 'text-green-600';
    if (s >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (s: number) => {
    if (s >= 0.9) return <CheckCircle className="w-5 h-5 inline-block mr-2" />;
    if (s >= 0.7) return <AlertTriangle className="w-5 h-5 inline-block mr-2" />;
    return <XCircle className="w-5 h-5 inline-block mr-2" />;
  };

  return (
    <div className="mt-4 p-3 border-l-4 rounded-r-lg bg-gray-50 border-gray-300">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Pronunciation Feedback</h4>
      
      <div className={`flex items-center font-bold ${getScoreColor(score)}`}>
        {getScoreIcon(score)}
        Score: {Math.round(score * 100)}%
      </div>

      {corrections && corrections.length > 0 && (
        <div className="mt-2">
          <h5 className="text-xs font-semibold text-gray-600">Corrections:</h5>
          <ul className="list-disc list-inside text-xs text-gray-600 font-mono">
            {corrections.map((correction, i) => <li key={i}>{correction}</li>)}
          </ul>
        </div>
      )}

      {tips && tips.length > 0 && (
        <div className="mt-2">
          <h5 className="text-xs font-semibold text-gray-600">Tips:</h5>
          <ul className="list-disc list-inside text-xs text-gray-600">
            {tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PronunciationFeedback;