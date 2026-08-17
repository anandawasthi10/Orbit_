'use client';

import { useState, useEffect } from 'react';
import TopHeader from '@/components/TopHeader';
import {
  BookOpen,
  Plus,
  ExternalLink,
  Trash2,
  Loader2,
  X,
  FileText,
  Palette,
  Wrench,
  Bookmark,
  Layers,
} from 'lucide-react';

const CATEGORIES = ['Documentation', 'Design', 'Tools', 'Reference', 'Other'];

const CATEGORY_ICONS = {
  Documentation: FileText,
  Design: Palette,
  Tools: Wrench,
  Reference: Bookmark,
  Other: Layers,
};

const CATEGORY_COLORS = {
  Documentation: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Design: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  Tools: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Reference: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Other: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

function MemberAvatar({ src, name }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'M';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        onError={() => setImgError(true)}
        className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
      />
    );
  }

  return (
    <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
      {initial}
    </div>
  );
}

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: 'Documentation',
  });

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/resources');
      if (!res.ok) throw new Error('Failed to fetch resources');
      const data = await res.json();
      setResources(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add resource');
      }

      setFormData({ title: '', url: '', category: 'Documentation' });
      setShowModal(false);
      await fetchResources();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!confirm('Are you sure you want to remove this resource link?')) return;

    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete resource');
      await fetchResources();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredResources =
    activeCategoryFilter === 'All'
      ? resources
      : resources.filter((r) => r.category === activeCategoryFilter);

  // Group resources by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filteredResources.filter((r) => r.category === cat);
    if (items.length > 0) {
      acc[cat] = items;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <TopHeader
        title="Resources"
        subtitle="Curated documentation, design assets, and dev tools for Orbit teams."
      />

      {/* Action Bar & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
              activeCategoryFilter === 'All'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            All Resources ({resources.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = resources.filter((r) => r.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  activeCategoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="saas-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Resource</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Fetching resources...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          Failed to load resources: {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredResources.length === 0 && (
        <div className="saas-card bg-white rounded-2xl p-12 text-center max-w-md mx-auto my-10 space-y-4 border border-slate-200 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Resources Found</h3>
          <p className="text-xs font-medium text-slate-600">
            Share important documentation links, Figma design kits, or repository links with your team!
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="saas-btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Resource</span>
          </button>
        </div>
      )}

      {/* Grouped Category Resource List */}
      {!loading && !error && Object.keys(grouped).length > 0 && (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => {
            const CatIcon = CATEGORY_ICONS[category] || Layers;
            const catBadge = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className={`p-1.5 rounded-lg border ${catBadge.bg} ${catBadge.text} ${catBadge.border}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{category}</h3>
                  <span className="text-xs text-slate-600 font-semibold">({items.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((res) => {
                    const addedByName = res.addedBy?.name || 'Workspace Member';
                    const avatarUrl = res.addedBy?.avatarUrl || '';

                    return (
                      <div
                        key={res._id || res.id}
                        className="saas-card bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5 line-clamp-1 transition-colors"
                            >
                              <span>{res.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 shrink-0" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteResource(res._id || res.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Resource"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-600 font-semibold font-mono truncate">
                            {res.url}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-700 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MemberAvatar src={avatarUrl} name={addedByName} />
                            <span className="truncate font-semibold text-slate-800">{addedByName}</span>
                          </div>

                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${catBadge.bg} ${catBadge.text} ${catBadge.border}`}>
                            {category}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Team Resource</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resource Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Orbit Figma Design System"
                  className="w-full px-3 py-2 rounded-xl saas-input text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resource URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://figma.com/file/..."
                  className="w-full px-3 py-2 rounded-xl saas-input text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl saas-input text-xs text-slate-800"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="saas-btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Add Resource'
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
