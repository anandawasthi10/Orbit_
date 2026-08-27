'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Play,
  UserCheck,
  RotateCcw,
  Loader2,
  X,
  Sparkles,
  Lock,
  FolderKanban,
  Filter,
  Send,
  ExternalLink,
  Upload,
  Check,
  XCircle,
  FileText,
  AlertCircle,
  Eye,
  ShieldCheck,
  User,
  Clock,
  Tag,
  Flag,
} from 'lucide-react';
import TopHeader from '@/components/TopHeader';
import SubmitTaskModal from '@/components/SubmitTaskModal';
import { ITask, IMember, IProject, ISubmission } from '@/types';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Research: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Frontend: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  Backend: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  DevOps: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  'UI/UX': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  Documentation: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  General: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
};

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  low: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  medium: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  high: { label: 'High', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  todo: { label: 'Pending', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  submitted: { label: 'Submitted', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  completed: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const COLUMNS = [
  { id: 'todo', title: 'Pending Tasks', badgeBg: 'bg-amber-100 text-amber-800' },
  { id: 'submitted', title: 'Submitted (Needs Review)', badgeBg: 'bg-indigo-100 text-indigo-800' },
  { id: 'completed', title: 'Approved & Completed', badgeBg: 'bg-emerald-100 text-emerald-800' },
  { id: 'rejected', title: 'Rejected', badgeBg: 'bg-rose-100 text-rose-800' },
];

function MemberAvatar({ member, size = 'w-6 h-6' }: { member?: any; size?: string }) {
  const [imgError, setImgError] = useState(false);
  if (!member) return null;

  const initial = member.name?.charAt(0).toUpperCase() || 'M';

  if (member.avatarUrl && !imgError) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.name || 'Member'}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover ring-2 ring-slate-200 shrink-0`}
        title={member.name}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-slate-200 shrink-0`}
      title={member.name}
    >
      {initial}
    </div>
  );
}

function SortableTaskCard({
  task,
  sessionUser,
  canAssignTask,
  onDelete,
  onUpdateStatus,
  onAssignToMe,
  onSubmitTaskClick,
  onReviewClick,
}: {
  task: any;
  sessionUser: any;
  canAssignTask: boolean;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onAssignToMe: (id: string) => void;
  onSubmitTaskClick: (task: any) => void;
  onReviewClick: (task: any) => void;
}) {
  const taskId = task._id || task.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const catStyle = CATEGORY_COLORS[task.category || 'General'] || CATEGORY_COLORS.General;
  const priorityStyle = PRIORITY_BADGES[task.priority || 'medium'] || PRIORITY_BADGES.medium;
  const statusStyle = STATUS_BADGES[task.status || 'todo'] || STATUS_BADGES.todo;

  const assignedToMember = task.assignedTo;
  const assignedToId = assignedToMember?._id || assignedToMember?.id || assignedToMember;
  const currentUserId = sessionUser?.id;
  const isAssignedToMe = assignedToId && String(assignedToId) === String(currentUserId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:shadow-md transition-all group space-y-3 cursor-grab active:cursor-grabbing"
    >
      {/* Category, Priority & Action Buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
          >
            {task.category}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
          >
            {priorityStyle.label} Priority
          </span>
        </div>

        {canAssignTask && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(taskId);
            }}
            className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Task Title & Description */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 leading-snug">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
        )}
      </div>

      {/* Assignee & Deadline Info */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          {assignedToMember ? (
            <div className="flex items-center gap-1.5">
              <MemberAvatar member={assignedToMember} size="w-5 h-5" />
              <span className="text-xs font-semibold text-slate-700 truncate max-w-28">
                {assignedToMember.name}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssignToMe(taskId);
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
            >
              <UserCheck className="w-3 h-3" />
              Assign to me
            </button>
          )}
        </div>

        {task.deadline && (
          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Submission Status & Action Call-to-Action */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
          {statusStyle.label}
        </span>

        {/* Member Submit Action */}
        {(task.status === 'todo' || task.status === 'in_progress' || task.status === 'pending' || task.status === 'rejected') && (isAssignedToMe || canAssignTask) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSubmitTaskClick(task);
            }}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5"
          >
            <Send className="w-3 h-3" />
            {task.status === 'rejected' ? 'Resubmit Task' : 'Submit Task'}
          </button>
        )}

        {/* Review Submission Action for Submitted/Approved/Rejected Tasks (ADMIN ONLY) */}
        {(task.status === 'submitted' || task.status === 'approved' || task.status === 'completed' || task.submission) && canAssignTask && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReviewClick(task);
            }}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Eye className="w-3 h-3 text-blue-600" />
            View Submission
          </button>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  id,
  title,
  badgeBg,
  tasks,
  sessionUser,
  canAssignTask,
  onDelete,
  onUpdateStatus,
  onAssignToMe,
  onSubmitTaskClick,
  onReviewClick,
}: {
  id: string;
  title: string;
  badgeBg: string;
  tasks: any[];
  sessionUser: any;
  canAssignTask: boolean;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onAssignToMe: (id: string) => void;
  onSubmitTaskClick: (task: any) => void;
  onReviewClick: (task: any) => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col min-h-128 shadow-2xs">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
        <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${badgeBg}`}>
          {tasks.length}
        </span>
      </div>

      {/* Task List Container */}
      <div ref={setNodeRef} className="flex-1 space-y-3">
        <SortableContext
          items={tasks.map((t) => t._id || t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task._id || task.id}
              task={task}
              sessionUser={sessionUser}
              canAssignTask={canAssignTask}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              onAssignToMe={onAssignToMe}
              onSubmitTaskClick={onSubmitTaskClick}
              onReviewClick={onReviewClick}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium text-center p-4">
            No tasks in {title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function TasksContent() {
  const searchParams = useSearchParams();
  const highlightTaskId = searchParams.get('taskId');

  const { data: session } = useSession();
  const sessionUser = session?.user;

  // Determine if user has Admin privileges
  const userRole = (sessionUser as any)?.role || 'Member';
  const isAdmin =
    userRole.toLowerCase().includes('admin') ||
    userRole.toLowerCase().includes('lead') ||
    userRole.toLowerCase().includes('manager') ||
    userRole.toLowerCase().includes('ceo') ||
    userRole.toLowerCase().includes('founder');

  // Tasks & Directory State
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');

  // Modals State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    category: 'Frontend',
    assignedTo: '',
    priority: 'medium',
    deadline: '',
  });

  const [submittingTask, setSubmittingTask] = useState<any | null>(null);

  const [reviewingTask, setReviewingTask] = useState<any | null>(null);
  const [reviewSubmission, setReviewSubmission] = useState<any | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, membersRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/members'),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }
    } catch (err) {
      console.error('Error loading task manager:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle deep-linked task from notification click
  useEffect(() => {
    if (highlightTaskId && tasks.length > 0) {
      const target = tasks.find((t) => (t._id || t.id) === highlightTaskId);
      if (target) {
        if (isAdmin || target.status === 'submitted' || target.status === 'approved' || target.status === 'completed' || target.submission) {
          handleOpenReviewModal(target);
        } else {
          setSubmittingTask(target);
        }
      }
    }
  }, [highlightTaskId, tasks, isAdmin]);

  // Filter tasks based on view mode (all vs my tasks)
  const currentUserId = (sessionUser as any)?.id;
  const filteredTasks = tasks.filter((t) => {
    if (filterMode === 'my') {
      const assignedId = t.assignedTo?._id || t.assignedTo?.id || t.assignedTo;
      return assignedId && String(assignedId) === String(currentUserId);
    }
    return true;
  });

  // Assign Task Submit Handler (Admin)
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.title.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assignForm.title.trim(),
          description: assignForm.description.trim(),
          category: assignForm.category,
          assignedTo: assignForm.assignedTo || null,
          priority: assignForm.priority,
          deadline: assignForm.deadline || null,
          status: 'todo',
        }),
      });

      if (res.ok) {
        setShowAssignModal(false);
        setAssignForm({
          title: '',
          description: '',
          category: 'Frontend',
          assignedTo: '',
          priority: 'medium',
          deadline: '',
        });
        showToast('Task assigned successfully!');
        fetchData();
      }
    } catch (err) {
      console.error('Assign task error:', err);
    }
  };

  // Submit Task Work Handler (Team Member)
  const handleOpenSubmitModal = (task: any) => {
    setSubmittingTask(task);
  };

  // Review Submission Handler (Admin)
  const handleOpenReviewModal = async (task: any) => {
    setReviewingTask(task);
    const taskId = task._id || task.id;
    try {
      const res = await fetch(`/api/submissions?taskId=${taskId}`);
      if (res.ok) {
        const subs = await res.json();
        if (subs && subs.length > 0) {
          setReviewSubmission(subs[0]);
          return;
        }
      }
    } catch (err) {
      console.error('Fetch submission error:', err);
    }

    // Fallback to task document fields (e.g. from Firestore update)
    if (task.submission) {
      setReviewSubmission(task.submission);
    } else if (task.submissionLink || task.submissionNote || task.submissionFile) {
      setReviewSubmission({
        taskId,
        link: task.submissionLink || '',
        screenshotUrl: task.submissionFile || (task.submissionFiles ? task.submissionFiles[0] : ''),
        note: task.submissionNote || '',
        status: task.status || 'submitted',
        submittedAt: task.submittedAt || task.updatedAt,
        submittedBy: task.assignedTo || { name: task.submittedByName || 'Team Member' },
      });
    } else {
      setReviewSubmission(null);
    }
  };

  const handleUpdateSubmissionStatus = async (status: 'approved' | 'rejected') => {
    if (!reviewingTask || !reviewSubmission) return;

    setIsReviewing(true);
    try {
      const subId = reviewSubmission._id || reviewSubmission.id;
      const res = await fetch(`/api/submissions/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setReviewingTask(null);
        setReviewSubmission(null);
        showToast(`Task submission marked as ${status.toUpperCase()}!`);
        fetchData();
      }
    } catch (err) {
      console.error('Update submission error:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Task deleted');
        setTasks((prev) => prev.filter((t) => (t._id || t.id) !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleUpdateTaskStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => ((t._id || t.id) === id ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleAssignToMe = async (id: string) => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: currentUserId }),
      });

      if (res.ok) {
        showToast('Task assigned to you');
        fetchData();
      }
    } catch (err) {
      console.error('Assign error:', err);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const targetColumn = COLUMNS.find((c) => c.id === overId);

    if (targetColumn) {
      handleUpdateTaskStatus(activeId, targetColumn.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <TopHeader
        title="Task Manager & Submissions"
        subtitle="Role-based task assignment, live URL submissions, and admin approval workflow"
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Control Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* View Mode Toggle: All vs My Tasks */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Workspace Tasks ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('my')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'my'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Tasks
              </button>
            </div>

            {/* User Role Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Role: {userRole}</span>
            </div>
          </div>

          {/* Action: Assign Task (Admin Only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Assign New Task
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="h-96 flex items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Loading task workflow...</span>
          </div>
        ) : (
          /* Kanban Drag and Drop Columns */
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {COLUMNS.map((col) => {
                const columnTasks = filteredTasks.filter((t) => {
                  if (col.id === 'todo') return t.status === 'todo' || t.status === 'pending' || t.status === 'in_progress';
                  if (col.id === 'submitted') return t.status === 'submitted';
                  if (col.id === 'completed') return t.status === 'completed' || t.status === 'approved';
                  if (col.id === 'rejected') return t.status === 'rejected';
                  return false;
                });

                return (
                  <KanbanColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    badgeBg={col.badgeBg}
                    tasks={columnTasks}
                    sessionUser={sessionUser}
                    canAssignTask={isAdmin}
                    onDelete={handleDeleteTask}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onAssignToMe={handleAssignToMe}
                    onSubmitTaskClick={handleOpenSubmitModal}
                    onReviewClick={handleOpenReviewModal}
                  />
                );
              })}
            </div>
          </DndContext>
        )}
      </main>

      {/* MODAL 1: Admin "Assign Task" Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assign New Task</h3>
                  <p className="text-xs text-slate-500">Create & delegate task to workspace members</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                  placeholder="e.g. Build Responsive User Dashboard"
                  className="w-full px-3.5 py-2 rounded-xl saas-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Description
                </label>
                <textarea
                  rows={3}
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                  placeholder="Detailed task guidelines, goals, and submission expectations..."
                  className="w-full px-3.5 py-2 rounded-xl saas-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assign To
                  </label>
                  <select
                    value={assignForm.assignedTo}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl saas-input text-xs"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m._id || m.id} value={m._id || m.id}>
                        {m.name} ({m.role || 'Member'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={assignForm.priority}
                    onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl saas-input text-xs font-semibold"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={assignForm.category}
                    onChange={(e) => setAssignForm({ ...assignForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl saas-input text-xs"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="UI/UX">UI/UX Design</option>
                    <option value="Research">Research</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Documentation">Documentation</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={assignForm.deadline}
                    onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl saas-input text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Team Member "Submit Task" Modal (GSAP Animated + Firebase Storage/Firestore Sync) */}
      <SubmitTaskModal
        isOpen={Boolean(submittingTask)}
        onClose={() => setSubmittingTask(null)}
        task={submittingTask}
        sessionUser={sessionUser}
        onSubmitSuccess={() => fetchData()}
        showToast={showToast}
      />

      {/* MODAL 3: Admin "Review Submission" Modal */}
      {reviewingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Review Task Submission</h3>
                  <p className="text-xs text-slate-500">Inspect work link, screenshot, and approve/reject status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Task Overview Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{reviewingTask.title}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    {reviewingTask.status?.toUpperCase()}
                  </span>
                </div>
                {reviewingTask.description && (
                  <p className="text-slate-600 text-xs">{reviewingTask.description}</p>
                )}
              </div>

              {/* Submitter Info */}
              {reviewSubmission?.submittedBy && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={reviewSubmission.submittedBy} size="w-8 h-8" />
                    <div>
                      <p className="font-bold text-slate-900">{reviewSubmission.submittedBy.name}</p>
                      <p className="text-[10px] text-slate-500">{reviewSubmission.submittedBy.email}</p>
                    </div>
                  </div>
                  {reviewSubmission.submittedAt && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Submitted {new Date(reviewSubmission.submittedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Submission Link (Required) */}
              {reviewSubmission?.link && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Work Submission Link
                  </label>
                  <a
                    href={reviewSubmission.link.startsWith('http') ? reviewSubmission.link : `https://${reviewSubmission.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-100 font-bold text-xs flex items-center justify-between transition-colors group"
                  >
                    <span className="truncate pr-2">{reviewSubmission.link}</span>
                    <ExternalLink className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              )}

              {/* Screenshot Preview */}
              {reviewSubmission?.screenshotUrl && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Uploaded Screenshot / Proof
                  </label>
                  <div
                    onClick={() => setZoomedImage(reviewSubmission.screenshotUrl)}
                    className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900 group cursor-pointer"
                  >
                    <img
                      src={reviewSubmission.screenshotUrl}
                      alt="Submission Screenshot"
                      className="w-full max-h-48 object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-3 py-1 rounded-full bg-white/90 text-slate-900 text-xs font-bold shadow">
                        Click to enlarge proof
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submitter Note */}
              {reviewSubmission?.note && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Submitter Note
                  </label>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                    {reviewSubmission.note}
                  </div>
                </div>
              )}

              {/* Admin Approval / Rejection Controls */}
              {isAdmin && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isReviewing}
                    onClick={() => handleUpdateSubmissionStatus('rejected')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Work
                  </button>

                  <button
                    type="button"
                    disabled={isReviewing}
                    onClick={() => handleUpdateSubmissionStatus('approved')}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Work & Complete Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Zoomed Image Lightbox */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={zoomedImage}
              alt="Enlarged Proof"
              className="max-h-[85vh] w-auto mx-auto rounded-xl shadow-2xl border border-white/20"
            />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-4 -right-4 p-2 bg-white text-slate-900 rounded-full shadow-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
