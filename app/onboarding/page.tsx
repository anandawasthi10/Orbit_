'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, FileText, Code2, Loader2, CheckCircle2 } from 'lucide-react';
import TopHeader from '@/components/TopHeader';

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    skills: '',
    avatarUrl: '',
  });

  const [avatarPreview, setAvatarPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchMyProfile() {
      try {
        const res = await fetch('/api/members/me');
        if (res.ok) {
          const profile = await res.json();
          setFormData({
            name: profile.name || session?.user?.name || '',
            role: profile.role || '',
            bio: profile.bio || '',
            skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
            avatarUrl: profile.avatarUrl || '',
          });
          setAvatarPreview(profile.avatarUrl || '');
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyProfile();
  }, [session]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setFormData((prev) => ({ ...prev, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/members/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills: skillsArray,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update profile');
      }

      const updatedData = await res.json();

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: updatedData.name,
          avatarUrl: updatedData.avatarUrl,
          role: updatedData.role,
          profileComplete: true,
        },
      });

      setMessage('Profile updated successfully!');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <TopHeader
        title="Edit Profile"
        subtitle="Manage your personal profile and workspace skills."
      />

      {/* Main Profile Form Card */}
      <div className="saas-card rounded-xl p-6 space-y-6 bg-white border border-slate-200/80 shadow-sm">
        {message && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-slate-100 ring-2 ring-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Profile Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Anand Awasthi"
              className="w-full px-3.5 py-2 rounded-lg saas-input text-sm text-slate-900 font-semibold"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              Role / Title
            </label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. Full Stack Lead Engineer"
              className="w-full px-3.5 py-2 rounded-lg saas-input text-sm text-slate-900 font-semibold"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Short Bio
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="e.g. Leading frontend & backend web applications architecture..."
              className="w-full px-3.5 py-2 rounded-lg saas-input text-sm text-slate-900 font-medium"
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
              placeholder="e.g. React.js, Next.js, Node.js, MongoDB, TypeScript"
              className="w-full px-3.5 py-2 rounded-lg saas-input text-sm text-slate-900 font-medium"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="saas-btn-primary px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
