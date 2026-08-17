'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
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

const COLUMNS = [
  { id: 'todo', title: 'To Do', badgeBg: 'bg-slate-200 text-slate-700' },
  { id: 'in_progress', title: 'In Progress', badgeBg: 'bg-blue-100 text-blue-700' },
  { id: 'completed', title: 'Completed', badgeBg: 'bg-emerald-100 text-emerald-700' },
];

function MemberAvatar({ member, size = 'w-6 h-6' }) {
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
}) {
  const taskId = task._id || task.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isDone = task.status === 'completed';
  const categoryStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.General;

  const assignedMemberId = task.assignedTo
    ? String(task.assignedTo._id || task.assignedTo.id || task.assignedTo)
    : null;

  const assignedEmail = task.assignedTo?.email?.toLowerCase().trim();
  const currentUserId = sessionUser?.id ? String(sessionUser.id) : null;
  const currentUserEmail = sessionUser?.email?.toLowerCase().trim();

  const isAssignedToCurrent =
    (assignedMemberId && currentUserId && assignedMemberId === currentUserId) ||
    (assignedEmail && currentUserEmail && assignedEmail === currentUserEmail);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`saas-card rounded-xl p-4 space-y-3 cursor-grab active:cursor-grabbing border ${
        isDragging
          ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/20'
          : 'border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300'
      } bg-white transition-all`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
        >
          {task.category}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(taskId);
          }}
          className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
          title="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <h4 className={`text-xs font-bold text-slate-900 leading-snug ${isDone ? 'line-through text-slate-500 font-medium' : ''}`}>
        {task.title}
      </h4>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignedTo ? (
            <>
              <MemberAvatar member={task.assignedTo} size="w-5 h-5" />
              <span className="truncate max-w-[90px] text-slate-800 font-semibold">
                {task.assignedTo.name}
              </span>
            </>
          ) : (
            <span className="text-slate-600 font-medium italic">Unassigned</span>
          )}
        </div>

        {task.deadline && (
          <div className="flex items-center gap-1 text-slate-600 font-semibold shrink-0">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Task Actions */}
      {task.status === 'todo' && (
        <div className="pt-2 border-t border-slate-100">
          {!task.assignedTo ? (
            canAssignTask ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignToMe(taskId);
                }}
                className="w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Assign to Me & Start
              </button>
            ) : (
              <div className="w-full py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                Only Admin can assign tasks
              </div>
            )
          ) : isAssignedToCurrent ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(taskId, 'in_progress');
              }}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Start Working
            </button>
          ) : (
            <div className="w-full py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              Assigned to {task.assignedTo.name.split(' ')[0]}
            </div>
          )}
        </div>
      )}

      {task.status === 'in_progress' && (
        <div className="pt-2 border-t border-slate-100">
          {isAssignedToCurrent ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(taskId, 'completed');
              }}
              className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark as Completed
            </button>
          ) : (
            <div className="w-full py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              Assigned to {task.assignedTo?.name ? task.assignedTo.name.split(' ')[0] : 'Teammate'}
            </div>
          )}
        </div>
      )}

      {task.status === 'completed' && (
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(taskId, 'in_progress');
            }}
            className="w-full py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            Re-open Task
          </button>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  sessionUser,
  canAssignTask,
  onDeleteTask,
  onUpdateStatus,
  onAssignToMe,
  onOpenAddTask,
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className="bg-slate-100/70 p-4 rounded-xl border border-slate-200/60 flex flex-col space-y-4 min-h-[500px]"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {column.title}
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${column.badgeBg}`}>
          {tasks.length}
        </span>
      </div>

      {/* Task Cards Context */}
      <SortableContext
        items={tasks.map((t) => t._id || t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 min-h-[200px]">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task._id || task.id}
              task={task}
              sessionUser={sessionUser}
              canAssignTask={canAssignTask}
              onDelete={onDeleteTask}
              onUpdateStatus={onUpdateStatus}
              onAssignToMe={onAssignToMe}
            />
          ))}

          {tasks.length === 0 && (
            <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
              No tasks
            </div>
          )}
        </div>
      </SortableContext>

      <button
        type="button"
        onClick={() => onOpenAddTask(column.id)}
        className="w-full py-2 mt-2 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 flex items-center justify-center gap-1.5 shadow-sm transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Task
      </button>
    </div>
  );
}

function TasksContent() {
  const { data: session } = useSession();
  const sessionUser = session?.user;
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    category: 'General',
    assignedTo: '',
    projectId: 'proj-sih-2026',
    status: 'todo',
    deadline: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const [tasksRes, membersRes, projectsRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/members'),
          fetch('/api/projects'),
        ]);

        if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
        const tasksData = await tasksRes.json();
        setTasks(tasksData);

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (urlProjectId) {
      setSelectedProjectId(urlProjectId);
    }
  }, [urlProjectId]);

  const canAssignTask = Boolean(
    sessionUser &&
      (members.length === 0 ||
        String(members[0]._id || members[0].id) === String(sessionUser.id) ||
        members[0].email?.toLowerCase() === sessionUser.email?.toLowerCase() ||
        ['admin', 'team lead', 'lead', 'project manager', 'founder', 'ceo'].some((r) =>
          (sessionUser.role || '').toLowerCase().includes(r)
        ))
  );

  const handleOpenModal = (initialStatus = 'todo') => {
    setNewTaskData({
      title: '',
      category: 'General',
      assignedTo: canAssignTask ? (sessionUser?.id || '') : '',
      projectId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?._id || projects[0]?.id || 'proj-sih-2026',
      status: initialStatus,
      deadline: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskData.title.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...newTaskData,
        assignedTo: canAssignTask ? (newTaskData.assignedTo || null) : null,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create task');
      }

      const created = await res.json();
      setTasks((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setNewTaskData({
        title: '',
        category: 'General',
        assignedTo: '',
        projectId: 'proj-sih-2026',
        status: 'todo',
        deadline: '',
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  };

  const handleAssignToMe = async (taskId) => {
    if (!sessionUser) return;
    const currentUserId = sessionUser.id;

    const currentMemberObj = members.find(
      (m) => (m._id || m.id) === currentUserId
    ) || {
      _id: currentUserId,
      id: currentUserId,
      name: sessionUser.name || 'Me',
      email: sessionUser.email || '',
      avatarUrl: sessionUser.avatarUrl || '',
    };

    setTasks((prev) =>
      prev.map((t) =>
        (t._id || t.id) === taskId
          ? { ...t, assignedTo: currentMemberObj, status: 'in_progress' }
          : t
      )
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: currentUserId,
          status: 'in_progress',
        }),
      });
    } catch (err) {
      console.error('Failed to assign task to me', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const draggedTask = tasks.find((t) => (t._id || t.id) === activeId);
    if (!draggedTask) return;

    let targetStatus = null;

    if (COLUMNS.some((col) => col.id === overId)) {
      targetStatus = overId;
    } else {
      const overTask = tasks.find((t) => (t._id || t.id) === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (!targetStatus || draggedTask.status === targetStatus) return;

    handleUpdateStatus(activeId, targetStatus);
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId === 'all') return true;
    if (!t.projectId) return false;
    const tProjId = typeof t.projectId === 'object' ? (t.projectId._id || t.projectId.id) : t.projectId;
    return String(tProjId) === String(selectedProjectId);
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <TopHeader
        title="Task Manager"
        subtitle="Accept assigned tasks, track in-progress work, and mark completed milestones."
      />

      {/* Action Bar & Project Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 uppercase tracking-wider pr-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Project:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedProjectId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
              selectedProjectId === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Projects ({tasks.length})
          </button>

          {projects.map((p) => {
            const pId = p._id || p.id;
            const isSelected = String(selectedProjectId) === String(pId);
            const pCount = tasks.filter((t) => {
              if (!t.projectId) return false;
              const tProjId = typeof t.projectId === 'object' ? (t.projectId._id || t.projectId.id) : t.projectId;
              return String(tProjId) === String(pId);
            }).length;

            return (
              <button
                key={pId}
                type="button"
                onClick={() => setSelectedProjectId(pId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>{p.name}</span>
                <span className="text-[10px] opacity-75">({pCount})</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal('todo')}
          className="saas-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Loading Task Manager...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          Failed to load tasks: {error}
        </div>
      )}

      {!loading && !error && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.id);
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  sessionUser={sessionUser}
                  canAssignTask={canAssignTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateStatus={handleUpdateStatus}
                  onAssignToMe={handleAssignToMe}
                  onOpenAddTask={handleOpenModal}
                />
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Create New Task
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project
                </label>
                <select
                  value={newTaskData.projectId || ''}
                  onChange={(e) => setNewTaskData({ ...newTaskData, projectId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg saas-input text-sm"
                >
                  {projects.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  placeholder="e.g. Implement Responsive Sidebar Layout"
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
                {canAssignTask ? (
                  <select
                    value={newTaskData.assignedTo}
                    onChange={(e) => setNewTaskData({ ...newTaskData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg saas-input text-sm bg-white text-slate-800"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m._id || m.id} value={m._id || m.id}>
                        {m.name} ({m.role || 'Member'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3.5 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Only Admin / Team Lead can assign tasks</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={newTaskData.deadline}
                  onChange={(e) => setNewTaskData({ ...newTaskData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg saas-input text-sm bg-white text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="saas-btn-primary px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>
            </form>
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
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Loading Task Manager...</p>
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
