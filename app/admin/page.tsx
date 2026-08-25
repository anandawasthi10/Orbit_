'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Loader2,
  Clock,
  Mail,
  Copy,
  Check,
  Edit3,
  Sliders,
  Shield,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  UserCheck,
  UserX,
  ExternalLink,
} from 'lucide-react';
import TopHeader from '@/components/TopHeader';
import { IMember, ITeam } from '@/types';

function MemberAvatar({
  src,
  name,
  size = 'w-9 h-9',
}: {
  src?: string | null;
  name?: string;
  size?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'M';

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

export default function AdminControlCenterPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const userRole = (user?.role || '').toLowerCase();
  const userEmail = (user?.email || '').toLowerCase();

  const isAdmin =
    userEmail === 'anandawasthi610@gmail.com' ||
    userRole.includes('admin') ||
    userRole.includes('lead') ||
    userRole.includes('manager') ||
    userRole.includes('ceo') ||
    userRole.includes('founder');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'members' | 'teams' | 'requests' | 'settings'>('members');

  // Data States
  const [members, setMembers] = useState<IMember[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals & Action States
  const [memberToDelete, setMemberToDelete] = useState<IMember | null>(null);
  const [memberToEditRole, setMemberToEditRole] = useState<IMember | null>(null);
  const [newRoleValue, setNewRoleValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Team Create Modal State
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [teamToDelete, setTeamToDelete] = useState<ITeam | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, teamsRes, requestsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/teams'),
        fetch('/api/teams/requests').catch(() => ({ ok: false, json: () => [] })),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(Array.isArray(data) ? data : []);
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.allTeams || data.teams || []);
      }
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setPendingRequests(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // Handle Delete Member
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    const id = memberToDelete._id || memberToDelete.id;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete member');
      setMembers((prev) => prev.filter((m) => m._id !== id && m.id !== id));
      showToast(`Member "${memberToDelete.name}" deleted successfully.`);
      setMemberToDelete(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Change Member Role
  const handleUpdateRole = async () => {
    if (!memberToEditRole || !newRoleValue) return;
    const id = memberToEditRole._id || memberToEditRole.id;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRoleValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      setMembers((prev) =>
        prev.map((m) => ((m._id === id || m.id === id) ? { ...m, role: newRoleValue } : m))
      );
      showToast(`Role for "${memberToEditRole.name}" updated to "${newRoleValue}".`);
      setMemberToEditRole(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Create Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');
      showToast(`Team "${data.name}" created with code ${data.code}!`);
      setNewTeamName('');
      setIsCreateTeamModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Team
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    const id = teamToDelete._id || teamToDelete.id;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete team');
      setTeams((prev) => prev.filter((t) => t._id !== id && t.id !== id));
      showToast(`Team "${teamToDelete.name}" deleted.`);
      setTeamToDelete(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Request Approval / Rejection
  const handleRequestAction = async (teamId: string, userId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/teams/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} request`);
      setPendingRequests((prev) =>
        prev.filter((r) => !(r.teamId === teamId && (r.user?._id === userId || r.user?.id === userId || r.user === userId)))
      );
      showToast(`Join request ${action === 'approve' ? 'Approved' : 'Rejected'}!`);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Unauthorized Screen
  if (status === 'authenticated' && !isAdmin) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600">
          The Admin Control Center is strictly restricted to Workspace Administrators.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex saas-btn-primary px-6 py-2.5 rounded-xl font-bold text-xs"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const filteredMembers = members.filter((m) => {
    const matchesQuery =
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.role || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'ADMIN' && (m.role || '').toLowerCase().includes('admin')) ||
      (roleFilter === 'LEAD' && (m.role || '').toLowerCase().includes('lead')) ||
      (roleFilter === 'MEMBER' && !(m.role || '').toLowerCase().includes('admin') && !(m.role || '').toLowerCase().includes('lead'));

    return matchesQuery && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Header */}
      <TopHeader
        title="Admin Control Center"
        subtitle="Full administrative command & workspace management authority for Orbit."
      />

      {/* Admin Authority Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Root Administrator
              </span>
              <span className="text-xs text-slate-400 font-medium">Logged in as {user?.name}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Workspace Governance &amp; Controls
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Manage member accounts, promote or reassign roles, configure team workspaces, handle join approvals, and administer Orbit.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsCreateTeamModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="saas-card rounded-xl p-5 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Members</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{members.length}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              {members.filter((m) => m.profileComplete).length} Verified
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card rounded-xl p-5 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Teams</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{teams.length}</h3>
            <p className="text-[10px] text-blue-600 font-bold mt-0.5">Workspace Groups</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card rounded-xl p-5 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingRequests.length}</h3>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">Requires Decision</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card rounded-xl p-5 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Admin Status</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">Active</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">Full Permissions</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'members'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Member Management ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'teams'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Team Workspaces ({teams.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-px relative ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Join Requests</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-extrabold text-[9px]">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>System &amp; Future Controls</span>
        </button>
      </div>

      {/* TAB 1: Member Management */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or role..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg saas-input text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="saas-input text-xs py-1.5 px-3 rounded-lg font-semibold"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins Only</option>
                <option value="LEAD">Team Leaders</option>
                <option value="MEMBER">Standard Members</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Skills Count</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-5 py-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((member) => {
                    const memberId = member._id || member.id;
                    const isSelf = memberId === user?.id || member.email === user?.email;
                    const isMainAdmin = (member.role || '').toLowerCase() === 'admin';

                    return (
                      <tr key={memberId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <MemberAvatar src={member.avatarUrl} name={member.name} />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{member.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[9px] font-extrabold">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">{member.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                              isMainAdmin
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : (member.role || '').toLowerCase().includes('lead')
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {member.role || 'Member'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {member.profileComplete ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                              <Clock className="w-3.5 h-3.5" />
                              Pending Bio
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 font-semibold">
                          {member.skills ? member.skills.length : 0} skills
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 font-medium text-[11px]">
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: '2-digit',
                              })
                            : 'Recent'}
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-2">
                          {/* Change Role Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setMemberToEditRole(member);
                              setNewRoleValue(member.role || 'Member');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            Role
                          </button>

                          {/* Delete Member Button */}
                          {!isSelf && !isMainAdmin ? (
                            <button
                              type="button"
                              onClick={() => setMemberToDelete(member)}
                              className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Team Workspaces */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Workspace Teams</h3>
              <p className="text-xs text-slate-500">Monitor all team rosters, invitation codes, and members.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateTeamModalOpen(true)}
              className="saas-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Team
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div key={team._id || team.id} className="saas-card bg-white rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 text-base">{team.name}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Created {team.createdAt ? new Date(team.createdAt).toLocaleDateString('en-GB') : 'Recently'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTeamToDelete(team)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Team Code Chip */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Invite Code:
                  </span>
                  <span className="font-mono font-black text-blue-600 text-xs tracking-wider">
                    {team.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(team.code)}
                    className="ml-auto text-slate-400 hover:text-slate-600 p-1"
                    title="Copy Code"
                  >
                    {copiedCode === team.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Member Roster */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    Members ({team.members ? team.members.length : 0}):
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(team.members || []).map((m: any, idx: number) => {
                      const userObj = typeof m.user === 'object' ? m.user : {};
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <MemberAvatar src={userObj.avatarUrl} name={userObj.name} size="w-6 h-6" />
                            <span className="font-semibold text-slate-800 text-[11px]">
                              {userObj.name || 'Member'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {m.role || 'Member'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Pending Join Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Student Join Requests</h3>
              <p className="text-xs text-slate-500">
                Approve or reject requests submitted by members trying to join specific teams.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-xs">
              {pendingRequests.length} Pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">All Clear! No Pending Requests</h4>
              <p className="text-xs text-slate-500">
                When new students request to join a team workspace, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req, idx) => {
                const userObj = typeof req.user === 'object' ? req.user : {};
                const userId = userObj._id || userObj.id || req.user;

                return (
                  <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <MemberAvatar src={userObj.avatarUrl} name={userObj.name} size="w-10 h-10" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{userObj.name || 'Student Member'}</h4>
                          <p className="text-xs text-slate-500">{userObj.email}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-extrabold text-[10px]">
                        Target: {req.teamName}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleRequestAction(req.teamId, userId, 'approve')}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Join
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleRequestAction(req.teamId, userId, 'reject')}
                        className="flex-1 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: System Settings & Future Extensions */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Admin Security &amp; Credentials</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Admin Email:</span>
                <span className="font-bold text-slate-800">anandawasthi610@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600">Active Permanent Admin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Database Mode:</span>
                <span className="font-bold text-blue-600">Dual-Mode (MongoDB + File DB)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Future Modules Ready for Extension</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              This Control Center is architected to house upcoming admin features:
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Workspace Broadcast Announcements
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                SIH Sprint Milestones &amp; Submissions Export
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Team Role Permission Customization
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* MODAL 1: Delete Member Confirmation */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 border border-red-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Member?</h3>
              <p className="text-sm text-slate-600">
                Permanently delete <span className="font-bold text-slate-900">{memberToDelete.name}</span>?
              </p>
              <p className="text-xs text-red-600 font-medium">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Role */}
      {memberToEditRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Change Member Role</h3>
              <button
                type="button"
                onClick={() => setMemberToEditRole(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Updating role for <span className="font-bold text-slate-900">{memberToEditRole.name}</span>
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Role
                </label>
                <select
                  value={newRoleValue}
                  onChange={(e) => setNewRoleValue(e.target.value)}
                  className="w-full saas-input text-xs py-2 px-3 rounded-xl font-semibold"
                >
                  <option value="Team Member">Team Member</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Team Leader">Team Leader</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberToEditRole(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                {actionLoading ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Team */}
      {isCreateTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Create New Team</h3>
              <button
                type="button"
                onClick={() => setIsCreateTeamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. AI Vision Core, Blockchain Sprints..."
                  className="w-full saas-input text-xs py-2.5 px-3.5 rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTeamModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  {actionLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Team */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 border border-red-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Team?</h3>
              <p className="text-sm text-slate-600">
                Permanently delete team <span className="font-bold text-slate-900">{teamToDelete.name}</span>?
              </p>
              <p className="text-xs text-red-600 font-medium">All member associations will be reset.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTeamToDelete(null)}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
