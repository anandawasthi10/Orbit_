'use client';

import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/TopHeader';
import {
  Users,
  UserPlus,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  LogOut,
  Crown,
  Calendar,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ITeam } from '@/types';

function MemberAvatar({ src, name, size = 'w-10 h-10' }: { src?: string | null; name?: string; size?: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'M';

  useEffect(() => {
    setImgError(false);
  }, [src]);

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
      className={`${size} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-slate-200 shrink-0`}
    >
      {initial}
    </div>
  );
}

export default function TeamsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'Member';
  const isAdmin =
    userRole.toLowerCase().includes('admin') ||
    userRole.toLowerCase().includes('lead') ||
    userRole.toLowerCase().includes('manager') ||
    userRole.toLowerCase().includes('ceo') ||
    userRole.toLowerCase().includes('founder');

  const [team, setTeam] = useState<ITeam | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [leavingSubmitting, setLeavingSubmitting] = useState(false);

  const [createError, setCreateError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchMyTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teams/me');
      if (!res.ok) throw new Error('Failed to fetch team data');
      const data = await res.json();
      setTeam(data.team || null);
    } catch (err) {
      console.error('Error loading team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeam();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreateError('');
    setCreateSubmitting(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');

      setTeam(data);
      setCreateName('');
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinError('');
    setJoinSubmitting(true);

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join team');

      setTeam(data);
      setJoinCode('');
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return;

    setLeavingSubmitting(true);
    try {
      const res = await fetch('/api/teams/leave', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to leave team');

      setTeam(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLeavingSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!team?.code) return;
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <TopHeader
        title="Team Workspace"
        subtitle="Manage team membership, generate join codes, and collaborate with your teammates."
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Checking team workspace...</p>
        </div>
      )}

      {/* Scenario A: User Has NO Team */}
      {!loading && !team && (
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2' : 'max-w-xl'} gap-6 max-w-5xl mx-auto pt-2`}>
          {/* Card 1: Create a Team (Admin Only) */}
          {isAdmin && (
            <div className="saas-card bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create a Team (Admin)</h2>
                  <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                    Start a new team workspace for your project, invite members using a unique 6-character code, and lead your team.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. SIH 2026 Core Builders"
                    className="w-full px-3.5 py-2 rounded-xl saas-input text-sm text-slate-900 font-semibold"
                  />
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                    {createError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="w-full saas-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Team...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Team
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Card 2: Join a Team */}
          <div className="saas-card bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Join a Team</h2>
                <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                  Have a team invitation code? Enter the 6-character uppercase code to immediately join your teammate&apos;s workspace.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinTeam} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  6-Character Team Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. K7XQ2M"
                  className="w-full px-3.5 py-2 rounded-xl saas-input text-sm text-slate-900 font-mono font-bold tracking-widest uppercase placeholder:font-normal placeholder:tracking-normal"
                />
              </div>

              {joinError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  {joinError}
                </div>
              )}

              <button
                type="submit"
                disabled={joinSubmitting}
                className="w-full saas-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {joinSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining Team...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Join Team
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scenario B: User HAS a Team */}
      {!loading && team && (
        <div className="space-y-6">
          {/* Main Team Card */}
          <div className="saas-card bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            {/* Header: Name + Code Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                    Active Workspace
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 mt-1">{team.name}</h1>
              </div>

              {/* Unique Join Code Pill */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl shrink-0">
                <div className="flex flex-col px-2">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Team Code
                  </span>
                  <span className="text-base font-black text-blue-600 font-mono tracking-widest">
                    {team.code}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Warning Banner if < 2 members */}
            {team.members && team.members.length < 2 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    Waiting for teammates — share your code! (1/2 minimum members)
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    Give team code <strong className="font-mono">{team.code}</strong> to your colleagues so they can join this workspace.
                  </p>
                </div>
              </div>
            )}

            {/* Member List Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Team Members ({team.members ? team.members.length : 0})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {team.members &&
                  team.members.map((m: any) => {
                    const u = typeof m.user === 'object' ? m.user : {};
                    const memberName = u.name || 'Teammate';
                    const memberAvatar = u.avatarUrl || '';
                    const memberEmail = u.email || '';
                    const isLeader = m.role === 'Team Leader';

                    return (
                      <div
                        key={m._id || u._id || m.joinedAt}
                        className="saas-card bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <MemberAvatar src={memberAvatar} name={memberName} />
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{memberName}</h4>
                              {memberEmail && (
                                <p className="text-[11px] text-slate-600 font-medium truncate max-w-[150px]">
                                  {memberEmail}
                                </p>
                              )}
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border shrink-0 ${
                              isLeader
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isLeader && <Crown className="w-3 h-3 text-indigo-600" />}
                            {m.role || 'Member'}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recently'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer Actions: Leave Team */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleLeaveTeam}
                disabled={leavingSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {leavingSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Leaving...
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    Leave Team
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
