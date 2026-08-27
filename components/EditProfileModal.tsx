'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { gsap } from 'gsap';
import {
  User,
  Camera,
  Briefcase,
  FileText,
  Code2,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updatedProfile: any) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { data: session, update: updateSession } = useSession();
  const sessionUser = session?.user as any;

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    skills: '',
    avatarUrl: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Load current profile on open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      fetch('/api/members/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setFormData({
              name: data.name || sessionUser?.name || '',
              role: data.role || sessionUser?.role || '',
              bio: data.bio || '',
              skills: Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || '',
              avatarUrl: data.avatarUrl || sessionUser?.avatarUrl || '',
            });
            setAvatarPreview(data.avatarUrl || sessionUser?.avatarUrl || '');
          } else if (sessionUser) {
            setFormData({
              name: sessionUser.name || '',
              role: sessionUser.role || '',
              bio: '',
              skills: '',
              avatarUrl: sessionUser.avatarUrl || '',
            });
            setAvatarPreview(sessionUser.avatarUrl || '');
          }
        })
        .catch((err) => {
          console.error('Failed to load profile data:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, sessionUser]);

  // GSAP Entrance & Exit Animations
  useEffect(() => {
    if (isOpen && modalRef.current && backdropRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.92, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: 'back.out(1.5)' }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (modalRef.current && backdropRef.current) {
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.15, ease: 'power2.in' });
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.94,
        y: 10,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setFormData((prev) => ({ ...prev, avatarUrl: result }));
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/members/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          role: formData.role.trim(),
          bio: formData.bio.trim(),
          skills: skillsArray,
          avatarUrl: formData.avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Synchronize with NextAuth Session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          avatarUrl: data.avatarUrl,
          role: data.role,
          profileComplete: true,
        },
      });

      setSuccessMsg('Profile updated successfully!');
      if (onProfileUpdated) {
        onProfileUpdated(data);
      }

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Edit Profile</h3>
              <p className="text-xs text-slate-500">Update your photo, name, role and details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">Loading profile...</span>
            </div>
          ) : (
            <>
              {/* Profile Photo Upload Section */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-3 ring-blue-500/30 bg-slate-200 flex items-center justify-center shadow-inner">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                        {formData.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="profile-avatar-input"
                    className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Change</span>
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Profile Picture
                  </label>
                  <label
                    htmlFor="profile-avatar-input"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </label>
                  <input
                    id="profile-avatar-input"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, or WebP up to 5MB.</p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tarun Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl saas-input text-xs font-bold text-slate-900"
                />
              </div>

              {/* Role / Title */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  Role / Title
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Frontend Developer, UI Designer"
                  className="w-full px-3.5 py-2.5 rounded-xl saas-input text-xs font-semibold text-slate-800"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Short Bio
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief summary about your skills and goals..."
                  className="w-full px-3.5 py-2 rounded-xl saas-input text-xs font-medium text-slate-800"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g. React, TypeScript, Next.js, Figma, Tailwind CSS"
                  className="w-full px-3.5 py-2.5 rounded-xl saas-input text-xs font-medium text-slate-800"
                />
              </div>
            </>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
