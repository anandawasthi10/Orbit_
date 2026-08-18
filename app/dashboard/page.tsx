'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Layers,
  CheckCircle2,
  Users,
  ArrowRight,
  Plus,
  Sparkles,
  Loader2,
  X,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
} from 'lucide-react';
import TopHeader from '@/components/TopHeader';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Research: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Frontend: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  Backend: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  DevOps: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  'UI/UX': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  Documentation: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  General: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
};

function MemberAvatar({ src, name, size = 'w-7 h-7' }: { src?: string | null; name?: string; size?: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'M';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover ring-2 ring-slate-200 shrink-0`}
        title={name}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-slate-200 shrink-0`}
      title={name}
    >
      {initial}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role || 'Member';
  const isAdmin =
    userRole.toLowerCase().includes('admin') ||
    userRole.toLowerCase().includes('lead') ||
    userRole.toLowerCase().includes('manager') ||
    userRole.toLowerCase().includes('ceo') ||
    userRole.toLowerCase().includes('founder');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('This Week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin Team Creation State
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [createTeamSubmitting, setCreateTeamSubmitting] = useState(false);

  // Admin Pending Join Requests State
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestActioningId, setRequestActioningId] = useState<string | null>(null);

  // Student Available Teams State
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
  const [requestedTeamIds, setRequestedTeamIds] = useState<Set<string>>(new Set());

  // Task & Update Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    category: 'General',
    assignedTo: '',
    status: 'todo',
    deadline: '',
  });

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [localUpdates, setLocalUpdates] = useState<any[]>([]);

  // Time of Day Greeting
  const [greeting, setGreeting] = useState('Good evening');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Load Dashboard, Teams & Pending Requests
  const loadAllDashboardData = async () => {
    try {
      const [dashRes, progressRes, teamsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/progress', { method: 'POST' }),
        fetch('/api/teams'),
      ]);

      if (!dashRes.ok) throw new Error('Failed to load dashboard data');
      const data = await dashRes.json();
      setDashboardData(data);
      setLocalUpdates(data.recentUpdates || []);

      if (progressRes.ok) {
        const progData = await progressRes.json();
        setSnapshots(progData.snapshots || []);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setAvailableTeams(teamsData.availableTeams || []);

        // Track teams where current student has pending requests
        const userId = user?.id;
        const pendingSet = new Set<string>();
        (teamsData.allTeams || teamsData.availableTeams || []).forEach((t: any) => {
          (t.pendingMembers || []).forEach((p: any) => {
            const pId = typeof p.user === 'object' ? (p.user._id || p.user.id) : p.user;
            if (String(pId) === String(userId) && p.status === 'pending') {
              pendingSet.add(t._id || t.id);
            }
          });
        });
        setRequestedTeamIds(pendingSet);
      }

      // If Admin, load pending join requests
      if (isAdmin) {
        const reqRes = await fetch('/api/teams/requests');
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setPendingRequests(reqData || []);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDashboardData();
  }, [isAdmin, user?.id]);

  // Admin Creates Team
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setCreateTeamSubmitting(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');

      setNewTeamName('');
      setIsCreateTeamModalOpen(false);
      await loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreateTeamSubmitting(false);
    }
  };

  // Student Requests to Join Team
  const handleStudentRequestJoin = async (teamId: string) => {
    setJoiningTeamId(teamId);
    try {
      const res = await fetch('/api/teams/request-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit join request');

      setRequestedTeamIds((prev) => new Set(prev).add(teamId));
      await loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJoiningTeamId(null);
    }
  };

  // Admin Approves or Rejects Student Request
  const handleAdminRequestAction = async (teamId: string, userId: string, action: 'approve' | 'reject') => {
    setRequestActioningId(`${teamId}-${userId}`);
    try {
      const res = await fetch('/api/teams/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} request`);

      await loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRequestActioningId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title.trim()) return;

    setTaskSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskData),
      });

      if (!res.ok) throw new Error('Failed to create task');

      await loadAllDashboardData();
      setIsTaskModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateText.trim()) return;

    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newUpdateText.trim(), type: 'general' }),
      });

      if (!res.ok) throw new Error('Failed to post update');

      setNewUpdateText('');
      setIsUpdateModalOpen(false);
      await loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const stats = dashboardData || {
    overallProgress: 0,
    activeTasksCount: 0,
    completedTasksCount: 0,
    todoTasksCount: 0,
    totalTasks: 0,
    hasTeam: false,
    teamMembersCount: 0,
    membersWithStats: [],
    recentTasks: [],
  };

  const tasksTodo = (stats.recentTasks || []).filter((t: any) => t.status === 'todo');
  const tasksInProgress = (stats.recentTasks || []).filter((t: any) => t.status === 'in_progress');
  const tasksCompleted = (stats.recentTasks || []).filter((t: any) => t.status === 'completed' || t.status === 'approved');

  // Format Recharts Data
  const rawChartData = snapshots.map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    rawDate: new Date(s.date),
    'Planned Progress': s.plannedPercent ?? 0,
    'Actual Progress': s.actualPercent ?? 0,
  }));

  const filteredChartData = rawChartData.filter((item) => {
    if (timeRange === 'This Week') {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      return item.rawDate >= weekAgo;
    }
    if (timeRange === 'This Month') {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      return item.rawDate >= monthAgo;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <TopHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'Team'}`}
        subtitle="Track our Orbit progress and stay aligned."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Loading workspace dashboard...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
          Failed to load dashboard: {error}
        </div>
      ) : (
        <>
          {/* Admin Banner & Create Team Action */}
          {isAdmin && (
            <div className="saas-card bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
              <div className="space-y-1 z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px] border border-indigo-500/30 uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    Admin Control Center
                  </span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">Create Teams &amp; Review Student Approvals</h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  Set up project team workspaces, invite members, approve student join requests, and assign tasks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateTeamModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 z-10 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Team</span>
              </button>
            </div>
          )}

          {/* Admin Pending Student Join Requests Alert Section */}
          {isAdmin && pendingRequests.length > 0 && (
            <div className="saas-card bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pending Student Member Join Requests</h3>
                    <p className="text-xs text-slate-600">Students requesting approval to join your team workspace</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-xs">
                  {pendingRequests.length} pending
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {pendingRequests.map((req) => {
                  const reqUser = typeof req.user === 'object' ? req.user : { name: 'Student', email: req.user };
                  const isActioning = requestActioningId === `${req.teamId}-${reqUser._id || reqUser.id}`;

                  return (
                    <div
                      key={`${req.teamId}-${reqUser._id || reqUser.id}`}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MemberAvatar src={reqUser.avatarUrl} name={reqUser.name} size="w-8 h-8" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{reqUser.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">Target: {req.teamName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={() => handleAdminRequestAction(req.teamId, reqUser._id || reqUser.id, 'approve')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={() => handleAdminRequestAction(req.teamId, reqUser._id || reqUser.id, 'reject')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student Available Teams Section (For Students Not Yet in a Team) */}
          {!isAdmin && !stats.hasTeam && availableTeams.length > 0 && (
            <div className="saas-card bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">Available Teams Created by Admins</h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Request to join an admin team workspace. Once approved, all tasks and updates will sync to your dashboard.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {availableTeams.map((t) => {
                  const isPending = requestedTeamIds.has(t._id || t.id);
                  const isJoining = joiningTeamId === (t._id || t.id);

                  return (
                    <div
                      key={t._id || t.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold uppercase">
                            CODE: {t.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {(t.members || []).length} active {(t.members || []).length === 1 ? 'member' : 'members'}
                        </p>
                      </div>

                      {isPending ? (
                        <div className="w-full py-2 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          <span>Request Pending Admin Approval</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isJoining}
                          onClick={() => handleStudentRequestJoin(t._id || t.id)}
                          className="w-full saas-btn-primary py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          {isJoining ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Submitting Request...</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Request to Join Team</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stat Cards Row */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              stats.hasTeam ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
            } gap-5`}
          >
            {/* Card 1: Overall Progress */}
            <div className="saas-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Overall Progress
                </span>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.overallProgress}%
                </p>
                <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${stats.overallProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-xs font-medium text-slate-600">Keep going!</p>
            </div>

            {/* Card 2: Active Tasks */}
            <div className="saas-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Tasks
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.activeTasksCount}
                </p>
              </div>
              <p className="text-xs font-medium text-slate-600">
                {stats.activeTasksCount} {stats.activeTasksCount === 1 ? 'task' : 'tasks'} in progress
              </p>
            </div>

            {/* Card 3: Completed Tasks */}
            <div className="saas-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Completed
                </span>
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.completedTasksCount}
                </p>
              </div>
              <p className="text-xs font-medium text-slate-600">Great work!</p>
            </div>

            {/* Card 4: Team Members */}
            {stats.hasTeam && (
              <div className="saas-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Team Members
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {stats.teamMembersCount}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {stats.membersWithStats.slice(0, 4).map((m: any, idx: number) => (
                    <MemberAvatar key={m._id || m.id || idx} src={m.avatarUrl} name={m.name} size="w-6 h-6" />
                  ))}
                  {stats.membersWithStats.length > 4 && (
                    <span className="text-[10px] font-bold text-slate-500 pl-1">
                      +{stats.membersWithStats.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Dashboard Grid: Progress Chart + Latest Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Project Progress Area Chart */}
            <div className="lg:col-span-2 saas-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Project Progress</h3>
                  <p className="text-xs font-medium text-slate-600">Planned Target vs Actual Completion</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400" />
                      <span>Planned Progress</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-blue-600 rounded" />
                      <span>Actual Progress</span>
                    </div>
                  </div>

                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                      itemStyle={{ color: '#60A5FA' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Planned Progress"
                      stroke="#94A3B8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="Actual Progress"
                      stroke="#2563EB"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#actualGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 1 Col: Latest Updates */}
            <div className="saas-card p-6 space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Latest Updates</h3>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Update</span>
                </button>
              </div>

              <div className="space-y-3.5 overflow-y-auto max-h-72 flex-1 pr-1">
                {localUpdates.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <MessageSquare className="w-6 h-6 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">No updates posted yet</p>
                  </div>
                ) : (
                  localUpdates.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-start gap-3 text-xs border-b border-slate-100 pb-3 last:border-none">
                      <MemberAvatar src={item.avatarUrl} name={item.user} size="w-7 h-7" />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate">{item.user}</span>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">{item.time}</span>
                        </div>
                        <p className="text-slate-600 leading-snug">{item.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Lower Section: Member Progress & Recent Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1 Col: Team Member Completion List */}
            <div className="saas-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Team Progress</h3>
                <Link href="/team" className="text-xs font-bold text-blue-600 hover:underline">
                  View All →
                </Link>
              </div>

              <div className="space-y-4">
                {stats.membersWithStats.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">No team members joined yet.</div>
                ) : (
                  stats.membersWithStats.map((member: any) => {
                    const percent = member.completionPercentage ?? 0;
                    return (
                      <div key={member._id || member.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <MemberAvatar src={member.avatarUrl} name={member.name} size="w-6 h-6" />
                            <span className="font-bold text-slate-900">{member.name}</span>
                          </div>
                          <span className="font-extrabold text-slate-700">{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 2 Cols: Recent Tasks Quick Kanban List */}
            <div className="lg:col-span-2 saas-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Task Overview</h3>
                  <p className="text-xs font-medium text-slate-600">Assigned sprint tasks &amp; status</p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsTaskModalOpen(true)}
                      className="saas-btn-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Task</span>
                    </button>
                  )}
                  <Link href="/tasks" className="text-xs font-bold text-blue-600 hover:underline pl-2">
                    Open Kanban Board →
                  </Link>
                </div>
              </div>

              {/* Task Columns Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Column 1: Todo */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      To Do ({tasksTodo.length})
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tasksTodo.length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-3 text-center">No tasks to do</p>
                    ) : (
                      tasksTodo.map((t: any) => (
                        <div key={t._id || t.id} className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
                          <p className="text-xs font-bold text-slate-900 leading-snug">{t.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 font-semibold">{t.category}</span>
                            {t.assignedTo && <MemberAvatar src={t.assignedTo.avatarUrl} name={t.assignedTo.name} size="w-4 h-4" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-blue-200">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      In Progress ({tasksInProgress.length})
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tasksInProgress.length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-3 text-center">No active tasks</p>
                    ) : (
                      tasksInProgress.map((t: any) => (
                        <div key={t._id || t.id} className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-2xs space-y-1">
                          <p className="text-xs font-bold text-slate-900 leading-snug">{t.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold">{t.category}</span>
                            {t.assignedTo && <MemberAvatar src={t.assignedTo.avatarUrl} name={t.assignedTo.name} size="w-4 h-4" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 3: Completed */}
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Completed ({tasksCompleted.length})
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tasksCompleted.length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-3 text-center">No completed tasks yet</p>
                    ) : (
                      tasksCompleted.map((t: any) => (
                        <div key={t._id || t.id} className="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs space-y-1">
                          <p className="text-xs font-bold text-slate-900 leading-snug line-through opacity-80">{t.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold">{t.category}</span>
                            {t.assignedTo && <MemberAvatar src={t.assignedTo.avatarUrl} name={t.assignedTo.name} size="w-4 h-4" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal 1: Admin Create Team Modal */}
      {isCreateTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Create Project Team</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTeamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. SIH 2026 Core Builders"
                  className="w-full px-3.5 py-2.5 rounded-xl saas-input text-sm text-slate-900 font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateTeamModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeamSubmitting}
                  className="saas-btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {createTeamSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Team Workspace</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Task</h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  placeholder="e.g. Implement NextAuth JWT session storage"
                  className="w-full px-3.5 py-2 rounded-xl saas-input text-sm text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newTaskData.category}
                    onChange={(e) => setNewTaskData({ ...newTaskData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl saas-input text-xs font-semibold text-slate-900"
                  >
                    <option value="Research">Research</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="DevOps">DevOps</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="Documentation">Documentation</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={newTaskData.assignedTo}
                    onChange={(e) => setNewTaskData({ ...newTaskData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl saas-input text-xs font-semibold text-slate-900"
                  >
                    <option value="">Unassigned</option>
                    {stats.membersWithStats.map((m: any) => (
                      <option key={m._id || m.id} value={m._id || m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={newTaskData.deadline}
                  onChange={(e) => setNewTaskData({ ...newTaskData, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl saas-input text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="saas-btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {taskSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Update Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Post Daily Update</h3>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Update Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newUpdateText}
                  onChange={(e) => setNewUpdateText(e.target.value)}
                  placeholder="What did you complete or work on today?"
                  className="w-full px-3.5 py-2.5 rounded-xl saas-input text-sm text-slate-900 font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="saas-btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  Post Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
