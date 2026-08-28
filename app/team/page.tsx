'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Mail, Calendar, CheckCircle2, UserX, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import TopHeader from '@/components/TopHeader';
import { IMember } from '@/types';

function MemberAvatar({ src, name, size = 'w-12 h-12' }: { src?: string | null; name?: string; size?: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'M';

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Member Avatar'}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover ring-2 ring-slate-200 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-base font-bold ring-2 ring-slate-200 shrink-0`}
    >
      {initial}
    </div>
  );
}

// Confirmation Modal
function DeleteConfirmModal({
  member,
  onConfirm,
  onCancel,
  deleting,
}: {
  member: IMember;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 border border-red-100">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>

        {/* Content */}
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-slate-900">Delete Member?</h3>
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete{' '}
            <span className="font-bold text-slate-900">{member.name}</span>?
          </p>
          <p className="text-xs text-red-600 font-medium">This action cannot be undone.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin =
    userRole.includes('admin') ||
    userRole.includes('lead') ||
    userRole.includes('manager') ||
    userRole.includes('ceo') ||
    userRole.includes('founder');

  const [members, setMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete state
  const [memberToDelete, setMemberToDelete] = useState<IMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      setLoading(true);
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error('Failed to fetch team members');
      const data = await res.json();
      setMembers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!memberToDelete) return;
    const id = memberToDelete._id || memberToDelete.id;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete member');
      // Remove from local state
      setMembers((prev) => prev.filter((m) => m._id !== id && m.id !== id));
      setMemberToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <DeleteConfirmModal
          member={memberToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setMemberToDelete(null); setDeleteError(''); }}
          deleting={deleting}
        />
      )}

      {/* Top Header Bar */}
      <TopHeader
        title="Directory"
        subtitle="Meet the active builders, designers, and engineers powering Orbit."
      />

      {/* Delete error toast */}
      {deleteError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {deleteError}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Fetching directory...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          Failed to load team directory: {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && members.length === 0 && (
        <div className="saas-card rounded-xl p-12 text-center max-w-md mx-auto my-10 space-y-4 bg-white">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <UserX className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Team Members Yet</h3>
          <p className="text-xs text-slate-500">
            Be the first to join Orbit and complete your profile!
          </p>
          <Link
            href="/signup"
            className="inline-flex saas-btn-primary px-5 py-2 rounded-lg text-xs font-bold"
          >
            Create Your Account
          </Link>
        </div>
      )}

      {/* Real Team Members Grid */}
      {!loading && !error && members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => {
            const memberId = member._id || member.id;
            const isSelf = memberId === user?.id;
            const isSystemAdmin = memberId === '671a53ff-505e-4e47-b75c-13963477cfdb' || member.role?.toLowerCase() === 'admin';

            return (
              <div
                key={memberId}
                className="saas-card rounded-xl p-6 flex flex-col justify-between hover:border-blue-300 transition-all duration-200 bg-white group relative"
              >
                {/* Admin Delete Button */}
                {isAdmin && !isSelf && !isSystemAdmin && (
                  <button
                    type="button"
                    onClick={() => { setDeleteError(''); setMemberToDelete(member); }}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                    title={`Delete ${member.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <MemberAvatar src={member.avatarUrl} name={member.name} />
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-xs font-semibold text-blue-600">{member.role || 'Member'}</p>
                      </div>
                    </div>
                    {member.profileComplete && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    )}
                  </div>

                  {member.bio && (
                    <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {member.skills && member.skills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                        Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {member.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer details */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 font-medium">
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors truncate max-w-[170px]"
                    title={member.email}
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{member.email}</span>
                  </a>
                  <span className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold shrink-0">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Joined {member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : 'Recently'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
