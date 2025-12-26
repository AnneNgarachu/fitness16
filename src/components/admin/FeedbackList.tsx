'use client';

import { useState } from 'react';

interface Feedback {
  id: string;
  type: 'suggestion' | 'complaint' | 'praise' | 'bug' | 'other';
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_notes: string | null;
  created_at: string;
  member: {
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
}

interface FeedbackListProps {
  feedback: Feedback[];
  onUpdate?: () => void;
}

const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
  suggestion: { icon: '💡', label: 'Suggestion', color: 'bg-blue-500/20 text-blue-400' },
  praise: { icon: '⭐', label: 'Praise', color: 'bg-green-500/20 text-green-400' },
  bug: { icon: '🐛', label: 'Bug', color: 'bg-red-500/20 text-red-400' },
  complaint: { icon: '😤', label: 'Complaint', color: 'bg-orange-500/20 text-orange-400' },
  other: { icon: '💬', label: 'Other', color: 'bg-zinc-500/20 text-zinc-400' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
  reviewed: { label: 'Reviewed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
};

export function FeedbackList({ feedback, onUpdate }: FeedbackListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (id: string, status: 'reviewed' | 'resolved') => {
    setUpdatingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to update');
      }

      // Refresh the list
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feedback');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (feedback.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-zinc-400">No feedback yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {feedback.map((item) => {
        const type = typeConfig[item.type] || typeConfig.other;
        const status = statusConfig[item.status];
        const isUpdating = updatingId === item.id;

        return (
          <div
            key={item.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${type.color}`}>
                  {type.icon} {type.label}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <span className="text-xs text-zinc-500">{formatDate(item.created_at)}</span>
            </div>

            {/* Member Info */}
            {item.member && (
              <div className="text-sm text-zinc-400 mb-2">
                <span className="font-medium text-white">
                  {item.member.first_name} {item.member.last_name}
                </span>
                <span className="ml-2 text-zinc-500">{item.member.phone}</span>
              </div>
            )}

            {/* Message */}
            <p className="text-white text-sm leading-relaxed mb-4">
              {item.message}
            </p>

            {/* Admin Notes */}
            {item.admin_notes && (
              <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
                <div className="text-xs text-zinc-500 mb-1">Admin Notes</div>
                <p className="text-sm text-zinc-300">{item.admin_notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            {item.status !== 'resolved' && (
              <div className="flex gap-2 pt-3 border-t border-zinc-800">
                {item.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(item.id, 'reviewed')}
                    disabled={isUpdating}
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdating ? 'Updating...' : '👀 Mark Reviewed'}
                  </button>
                )}
                <button
                  onClick={() => updateStatus(item.id, 'resolved')}
                  disabled={isUpdating}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Updating...' : '✅ Mark Resolved'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}