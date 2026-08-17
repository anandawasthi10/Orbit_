'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Loader2, MessageSquare, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import TopHeader from '@/components/TopHeader';

const TYPE_CONFIG = {
  progress: { label: 'Progress', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  blocker: { label: 'Blocker', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  announcement: { label: 'Announcement', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  general: { label: 'General', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};

function AuthorAvatar({ src, name, size = 'w-9 h-9' }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'U';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover ring-2 ring-slate-200 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-200 shrink-0`}
    >
      {initial}
    </div>
  );
}

export default function DailyUpdatesPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [updates, setUpdates] = useState([]);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const res = await fetch('/api/updates');
        if (!res.ok) throw new Error('Failed to fetch daily updates');
        const data = await res.json();
        setUpdates(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUpdates();
  }, []);

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), type }),
      });

      if (!res.ok) throw new Error('Failed to post update');

      const newEntry = await res.json();
      setUpdates((prev) => [newEntry, ...prev]);
      setMessage('');
      setType('general');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <TopHeader
        title="Daily Updates"
        subtitle="Share progress, blockers, and daily team highlights with your workspace."
      />

      {/* Post Daily Update Card */}
      <div className="saas-card rounded-xl p-6 space-y-4 bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <AuthorAvatar src={user?.avatarUrl} name={user?.name} />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Post a Daily Update</h3>
            <p className="text-xs font-medium text-slate-700">Share what you accomplished or what you're working on today</p>
          </div>
        </div>

        <form onSubmit={handleSubmitUpdate} className="space-y-4">
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Completed user authentication flow and updated team documentation..."
            className="w-full px-3.5 py-2.5 rounded-lg saas-input text-sm text-slate-900 placeholder:text-slate-400"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Type:
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-1.5 rounded-lg saas-input text-xs font-semibold bg-white text-slate-800"
              >
                <option value="general">General Update</option>
                <option value="progress">Progress Milestone</option>
                <option value="blocker">Blocker / Issue</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="saas-btn-primary px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Post Daily Update
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Activity Feed Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Activity Feed
          </h3>
          <span className="text-xs text-slate-700 font-semibold">
            {updates.length} {updates.length === 1 ? 'total update' : 'total updates'}
          </span>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading daily updates...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            Failed to load activity feed: {error}
          </div>
        )}

        {!loading && !error && updates.length === 0 && (
          <div className="saas-card rounded-xl p-12 text-center bg-white space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No updates yet</h4>
            <p className="text-xs text-slate-600 font-medium">Be the first teammate to share a progress update today!</p>
          </div>
        )}

        {!loading && !error && updates.length > 0 && (
          <div className="space-y-3">
            {updates.map((item) => {
              const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
              const authorName = item.author?.name || 'Teammate';
              const authorRole = item.author?.role || 'Member';
              const authorAvatar = item.author?.avatarUrl || '';

              return (
                <div
                  key={item._id || item.id}
                  className="saas-card rounded-xl p-4 flex items-start gap-3.5 bg-white border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all"
                >
                  <AuthorAvatar src={authorAvatar} name={authorName} />

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{authorName}</span>
                        <span className="text-[11px] text-slate-600 font-semibold">({authorRole})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeConfig.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
                          {typeConfig.label}
                        </span>
                        <span className="text-[11px] text-slate-600 font-semibold">
                          {getRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed pt-1 whitespace-pre-line">
                      {item.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
