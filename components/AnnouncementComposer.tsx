'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Loader2, Megaphone, Sparkles, ShieldCheck, User } from 'lucide-react';

interface AnnouncementComposerProps {
  onPost: (message: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function AnnouncementComposer({ onPost, isSubmitting = false }: AnnouncementComposerProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [message, setMessage] = useState('');

  const userRole = (user?.role || 'Member').toLowerCase();
  const isAdmin =
    user?.email === 'anandawasthi610@gmail.com' ||
    userRole.includes('admin') ||
    userRole.includes('lead') ||
    userRole.includes('manager') ||
    userRole.includes('ceo') ||
    userRole.includes('founder');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    const msg = message.trim();
    setMessage('');
    try {
      await onPost(msg);
    } catch (err) {
      setMessage(msg); // restore on error
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3.5 transition-all">
      {/* Header with Role Tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Broadcast Announcement
            </h3>
            <p className="text-xs text-slate-500">
              Share critical updates instantly across both Admin &amp; Member panels
            </p>
          </div>
        </div>

        {/* Poster Role Badge */}
        <div className="flex items-center gap-1.5">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Admin Broadcast
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Member Update
            </span>
          )}
        </div>
      </div>

      {/* Composer Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isAdmin
              ? 'Post an official team-wide announcement, sprint goal, or critical release notice...'
              : 'Post a project announcement, team shout-out, or milestone update for everyone...'
          }
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-slate-50/50 focus:bg-white"
        />

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Synced in real-time across all online teammates</span>
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Post Announcement</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
