'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type FeedbackType = 'suggestion' | 'complaint' | 'praise' | 'bug' | 'other';

interface FeedbackOption {
  id: FeedbackType;
  icon: string;
  label: string;
  description: string;
}

const feedbackTypes: FeedbackOption[] = [
  { id: 'suggestion', icon: '💡', label: 'Suggestion', description: 'Share an idea' },
  { id: 'praise', icon: '⭐', label: 'Praise', description: 'Something you love' },
  { id: 'bug', icon: '🐛', label: 'Bug Report', description: 'Report an issue' },
  { id: 'complaint', icon: '😤', label: 'Complaint', description: 'Let us know' },
  { id: 'other', icon: '💬', label: 'Other', description: 'Anything else' },
];

export default function FeedbackPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit feedback');
      }

      setSubmitted(true);
      
      // Reset and redirect after 2 seconds
      setTimeout(() => {
        router.push('/profile');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-zinc-400">Your feedback helps us improve</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-zinc-800 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            href="/profile" 
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white">Share Feedback</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              What type of feedback?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {feedbackTypes.slice(0, 3).map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    selectedType === type.id
                      ? 'bg-linear-to-r from-orange-500 to-pink-500 text-white'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {feedbackTypes.slice(3).map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    selectedType === type.id
                      ? 'bg-linear-to-r from-orange-500 to-pink-500 text-white'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label 
              htmlFor="message" 
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Your message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError('');
              }}
              placeholder="Tell us what's on your mind..."
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
            />
            <div className="flex justify-between mt-2 text-xs text-zinc-500">
              <span>{message.length < 10 ? `${10 - message.length} more characters needed` : '✓ Ready to submit'}</span>
              <span>{message.length}/2000</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || message.trim().length < 10}
            className="w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </button>

          {/* Privacy Note */}
          <p className="text-xs text-zinc-500 text-center">
            Your feedback is linked to your account so we can follow up if needed.
          </p>
        </form>
      </main>
    </div>
  );
}