'use client';

import { useState, useEffect } from 'react';
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
  Search,
  Bell,
  ArrowRight,
  Plus,
  Sparkles,
  Loader2,
  X,
  MessageSquare,
} from 'lucide-react';
import TopHeader from '@/components/TopHeader';

const CATEGORY_COLORS = {
  Research: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Frontend: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  Backend: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  DevOps: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  'UI/UX': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  Documentation: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  General: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
};

function MemberAvatar({ src, name, size = 'w-7 h-7' }) {
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
  const user = session?.user;

  const [dashboardData, setDashboardData] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [timeRange, setTimeRange] = useState('This Week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
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
  const [localUpdates, setLocalUpdates] = useState([]);

  // Time of Day Greeting
  const [greeting, setGreeting] = useState('Good evening');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch Dashboard Data & Auto-Upsert Progress Snapshots
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashRes, progressRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/progress', { method: 'POST' }),
        ]);

        if (!dashRes.ok) throw new Error('Failed to load dashboard data');
        const data = await dashRes.json();
        setDashboardData(data);
        setLocalUpdates(data.recentUpdates || []);

        if (progressRes.ok) {
          const progData = await progressRes.json();
          setSnapshots(progData.snapshots || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleCreateTask = async (e) => {
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

      const [dashRes, progressRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/progress', { method: 'POST' }),
      ]);

      if (dashRes.ok) {
        const updatedDash = await dashRes.json();
        setDashboardData(updatedDash);
      }
      if (progressRes.ok) {
        const progData = await progressRes.json();
        setSnapshots(progData.snapshots || []);
      }

      setIsTaskModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleAddUpdate = (e) => {
    e.preventDefault();
    if (!newUpdateText.trim()) return;

    const newEntry = {
      id: `update-${Date.now()}`,
      user: user?.name || 'Teammate',
      avatarUrl: user?.avatarUrl || '',
      message: newUpdateText.trim(),
      time: 'Just now',
    };

    setLocalUpdates([newEntry, ...localUpdates]);
    setNewUpdateText('');
    setIsUpdateModalOpen(false);
  };

  const stats = dashboardData || {
    overallProgress: 0,
    activeTasksCount: 0,
    completedTasksCount: 0,
    todoTasksCount: 0,
    hasTeam: false,
    teamMembersCount: 0,
    membersWithStats: [],
    recentTasks: [],
  };

  const tasksTodo = stats.recentTasks.filter((t) => t.status === 'todo');
  const tasksInProgress = stats.recentTasks.filter((t) => t.status === 'in_progress');
  const tasksCompleted = stats.recentTasks.filter((t) => t.status === 'completed');

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
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          Failed to load dashboard: {error}
        </div>
      ) : (
        <>
          {/* Stat Cards Row */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              stats.hasTeam ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
            } gap-5`}
          >
            {/* Card 1: Overall Progress (Blue) */}
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

            {/* Card 2: Active Tasks (Green) */}
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

            {/* Card 3: Completed Tasks (Purple) */}
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

            {/* Card 4: Team Members (Orange) - Shown ONLY if user belongs to a Team */}
            {stats.hasTeam && (
              <div className="saas-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Team Members
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {stats.teamMembersCount}
                  </p>
                </div>
                <p className="text-xs font-medium text-slate-600">In your team</p>
              </div>
            )}
          </div>

          {/* Main Content Grid: Left (2/3) vs Right Sidebar (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Progress Recharts Card */}
              <div className="saas-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Project Progress</h3>
                    <p className="text-xs font-medium text-slate-600">Planned Target vs Actual Completion</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {/* Chart Legend */}
                    <div className="hidden sm:flex items-center gap-4 text-slate-700 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-500 inline-block" />
                        Planned Progress
                      </span>
                      <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                        <span className="w-3 h-0.5 bg-blue-600 inline-block rounded-full" />
                        Actual Progress
                      </span>
                    </div>

                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none"
                    >
                      <option value="This Week">This Week</option>
                      <option value="This Month">This Month</option>
                      <option value="All Time">All Time</option>
                    </select>
                  </div>
                </div>

                {/* Recharts Area & Line Graph */}
                <div className="w-full h-60 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredChartData.length > 0 ? filteredChartData : rawChartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#475569"
                        fontSize={11}
                        fontWeight={600}
                        tickFormatter={(v) => `${v}%`}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#cbd5e1',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          color: '#0f172a',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                        formatter={(value) => [`${value}%`]}
                      />
                      <Area
                        type="monotone"
                        dataKey="Actual Progress"
                        stroke="#2563EB"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#actualGradient)"
                        dot={{ r: 4, fill: '#2563EB', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Planned Progress"
                        stroke="#64748b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Task Board Preview (Kanban) */}
              <div className="saas-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Task Board</h3>
                    <p className="text-xs text-slate-500">{stats.totalTasks} total tasks in workspace</p>
                  </div>

                  <a
                    href="/tasks"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                  >
                    View all
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>

                {/* 3-Column Compact Board Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TO DO Column */}
                  <div className="rounded-xl bg-slate-100/70 p-3.5 space-y-3 border border-slate-200/60">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        TO DO
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
                        {tasksTodo.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 min-h-[140px]">
                      {tasksTodo.slice(0, 3).map((task) => (
                        <div
                          key={task._id || task.id}
                          className="bg-white p-3 rounded-lg space-y-2 border border-slate-200/80 shadow-sm"
                        >
                          <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                            {task.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[task.category]?.bg || CATEGORY_COLORS.General.bg} ${CATEGORY_COLORS[task.category]?.text || CATEGORY_COLORS.General.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[task.category]?.dot || CATEGORY_COLORS.General.dot}`} />
                              {task.category}
                            </span>
                            {task.assignedTo && <MemberAvatar src={task.assignedTo.avatarUrl} name={task.assignedTo.name} size="w-5 h-5" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewTaskData({ title: '', category: 'General', assignedTo: user?.id || '', status: 'todo', deadline: '' });
                        setIsTaskModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-[11px] font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Add Task
                    </button>
                  </div>

                  {/* IN PROGRESS Column */}
                  <div className="rounded-xl bg-slate-100/70 p-3.5 space-y-3 border border-slate-200/60">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        IN PROGRESS
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                        {tasksInProgress.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 min-h-[140px]">
                      {tasksInProgress.slice(0, 3).map((task) => (
                        <div
                          key={task._id || task.id}
                          className="bg-white p-3 rounded-lg space-y-2 border border-slate-200/80 shadow-sm"
                        >
                          <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                            {task.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[task.category]?.bg || CATEGORY_COLORS.General.bg} ${CATEGORY_COLORS[task.category]?.text || CATEGORY_COLORS.General.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[task.category]?.dot || CATEGORY_COLORS.General.dot}`} />
                              {task.category}
                            </span>
                            {task.assignedTo && <MemberAvatar src={task.assignedTo.avatarUrl} name={task.assignedTo.name} size="w-5 h-5" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewTaskData({ title: '', category: 'General', assignedTo: user?.id || '', status: 'in_progress', deadline: '' });
                        setIsTaskModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-[11px] font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Add Task
                    </button>
                  </div>

                  {/* COMPLETED Column */}
                  <div className="rounded-xl bg-slate-100/70 p-3.5 space-y-3 border border-slate-200/60">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                        COMPLETED
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                        {tasksCompleted.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 min-h-[140px]">
                      {tasksCompleted.slice(0, 3).map((task) => (
                        <div
                          key={task._id || task.id}
                          className="bg-white p-3 rounded-lg space-y-2 border border-emerald-200/80 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-semibold text-slate-400 line-through line-clamp-2">
                              {task.title}
                            </p>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[task.category]?.bg || CATEGORY_COLORS.General.bg} ${CATEGORY_COLORS[task.category]?.text || CATEGORY_COLORS.General.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[task.category]?.dot || CATEGORY_COLORS.General.dot}`} />
                              {task.category}
                            </span>
                            {task.assignedTo && <MemberAvatar src={task.assignedTo.avatarUrl} name={task.assignedTo.name} size="w-5 h-5" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewTaskData({ title: '', category: 'General', assignedTo: user?.id || '', status: 'completed', deadline: '' });
                        setIsTaskModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-[11px] font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Add Task
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar (1/3 Width) */}
            <div className="space-y-6">
              {/* Team Members Panel (Only shown if user has joined a Team) */}
              {stats.hasTeam && stats.membersWithStats.length > 0 && (
                <div className="saas-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Team Members</h3>
                    <a
                      href="/teams"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                    >
                      View team
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>

                  <div className="space-y-3.5">
                    {stats.membersWithStats.slice(0, 6).map((member) => (
                      <div key={member._id || member.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <MemberAvatar src={member.avatarUrl} name={member.name} size="w-8 h-8" />
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">{member.name}</p>
                              <p className="text-[11px] font-medium text-slate-600">{member.role}</p>
                            </div>
                          </div>
                          <span className="font-bold text-blue-600 text-xs">
                            {member.completionPercentage}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${member.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Updates Panel */}
              <div className="saas-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Latest Updates</h3>
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    + Add Update
                  </button>
                </div>

                <div className="space-y-3">
                  {localUpdates.slice(0, 5).map((update) => (
                    <div key={update.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <MemberAvatar src={update.avatarUrl} name={update.user} size="w-8 h-8" />
                      <div className="space-y-0.5 text-xs flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{update.user}</span>
                          <span className="text-[10px] font-semibold text-slate-500">{update.time}</span>
                        </div>
                        <p className="text-slate-700 text-[11px] font-medium leading-relaxed">
                          {update.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Post Activity Update
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Add New Task
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  placeholder="e.g. Build User Onboarding Flow"
                  className="w-full px-3.5 py-2 rounded-lg saas-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newTaskData.category}
                    onChange={(e) => setNewTaskData({ ...newTaskData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg saas-input text-sm bg-white text-slate-800"
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
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={newTaskData.status}
                    onChange={(e) => setNewTaskData({ ...newTaskData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg saas-input text-sm bg-white text-slate-800"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assign To Member
                </label>
                <select
                  value={newTaskData.assignedTo}
                  onChange={(e) => setNewTaskData({ ...newTaskData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg saas-input text-sm bg-white text-slate-800"
                >
                  <option value="">Unassigned</option>
                  {stats.membersWithStats.map((m) => (
                    <option key={m._id || m.id} value={m._id || m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="saas-btn-primary px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {taskSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Add Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Update Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Post Latest Update
              </h3>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Update Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={newUpdateText}
                  onChange={(e) => setNewUpdateText(e.target.value)}
                  placeholder="e.g. Finished component design and updated API schema..."
                  className="w-full px-3.5 py-2 rounded-lg saas-input text-sm text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="saas-btn-primary px-5 py-2 rounded-lg text-xs font-bold"
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
