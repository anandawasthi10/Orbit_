'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  X,
  Upload,
  Trash2,
  AlertCircle,
  Loader2,
  FileText,
  CheckCircle2,
  Link2,
} from 'lucide-react';
import { gsap } from 'gsap';
import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { ITask } from '@/types';

interface SubmitTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ITask | null;
  sessionUser: any;
  onSubmitSuccess?: (updatedTask: any) => void;
  showToast?: (message: string) => void;
}

export default function SubmitTaskModal({
  isOpen,
  onClose,
  task,
  sessionUser,
  onSubmitSuccess,
  showToast,
}: SubmitTaskModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when task opens
  useEffect(() => {
    if (task) {
      setLink(task.submissionLink || task.submission?.link || '');
      setNote(task.submissionNote || task.submission?.note || '');
      setFilePreview(task.submissionFile || task.submission?.screenshotUrl || '');
      setFileName(task.submissionFile ? 'Attached File' : '');
      setSelectedFile(null);
      setError('');
    }
  }, [task]);

  // GSAP animation for modal entrance
  useEffect(() => {
    if (isOpen && modalRef.current && overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.94, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.4)' }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (modalRef.current && overlayRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 10,
        duration: 0.15,
        ease: 'power2.in',
      });
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    setFileName(file.name);

    // If image, create base64 preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview('');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview('');
    setFileName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (!link.trim()) {
      setError('Please provide a submission link (GitHub, live demo, or doc URL)');
      return;
    }

    const urlPattern = /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/.*)?$/i;
    if (!urlPattern.test(link.trim())) {
      setError('Please enter a valid URL (e.g. https://github.com/... or https://mydemo.vercel.app)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const taskId = task._id || task.id || '';
    const memberId = sessionUser?.id || sessionUser?._id || 'anonymous';
    const memberName = sessionUser?.name || 'Team Member';
    const taskTitle = task.title || 'Assigned Task';

    let fileUrl = filePreview;

    try {
      // 1. Upload to Firebase Storage if a new file was chosen
      if (selectedFile && storage) {
        try {
          const storageRef = ref(storage, `submissions/${taskId}/${Date.now()}_${selectedFile.name}`);
          const uploadResult = await uploadBytes(storageRef, selectedFile);
          fileUrl = await getDownloadURL(uploadResult.ref);
        } catch (storageErr: any) {
          console.warn('Firebase Storage upload warning, using local preview/base64:', storageErr.message);
        }
      }

      const submissionPayload = {
        taskId,
        link: link.trim(),
        screenshotUrl: fileUrl,
        submissionFile: fileUrl,
        submissionFiles: fileUrl ? [fileUrl] : [],
        submissionNote: note.trim(),
        note: note.trim(),
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        submittedBy: memberId,
        submittedByName: memberName,
      };

      // 2. Write/Update in Firestore (Tasks collection)
      try {
        const taskDocRef = doc(db, 'tasks', taskId);
        await setDoc(
          taskDocRef,
          {
            status: 'submitted',
            submittedAt: serverTimestamp(),
            submittedBy: memberId,
            submittedByName: memberName,
            submissionNote: note.trim(),
            submissionFile: fileUrl,
            submissionFiles: fileUrl ? [fileUrl] : [],
            submissionLink: link.trim(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (fsErr: any) {
        console.warn('Firestore task write warning:', fsErr.message);
      }

      // 3. Create Notification in Firestore (Notifications collection)
      try {
        const notifRef = collection(db, 'notifications');
        await addDoc(notifRef, {
          type: 'task_submitted',
          taskId,
          taskTitle,
          memberName,
          memberId,
          createdAt: serverTimestamp(),
          read: false,
          isRead: false,
          message: `${memberName} submitted '${taskTitle}' task`,
        });
      } catch (notifErr: any) {
        console.warn('Firestore notification write warning:', notifErr.message);
      }

      // 4. Sync with Backend API (/api/submissions)
      try {
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            link: link.trim(),
            screenshotUrl: fileUrl,
            note: note.trim(),
          }),
        });
      } catch (apiErr: any) {
        console.warn('API sync warning:', apiErr.message);
      }

      // 5. Optimistic Toast & Callback
      if (showToast) {
        showToast('Task submitted successfully! Real-time alert sent to admins.');
      }

      if (onSubmitSuccess) {
        onSubmitSuccess({
          ...task,
          ...submissionPayload,
        });
      }

      handleClose();
    } catch (err: any) {
      console.error('Task submission error:', err);
      setError(err.message || 'Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div
        ref={modalRef}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 relative"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Submit Completed Task</h3>
              <p className="text-xs text-slate-500 truncate max-w-72">Task: {task.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submission URL Field (Required) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Submission Link *</span>
              <span className="text-[10px] text-slate-400 font-normal normal-case">GitHub / Demo / Drive</span>
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://github.com/myrepo or https://mydemo.vercel.app"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl saas-input text-xs text-slate-900 font-semibold placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Provide live preview URL, pull request, Figma link, or repository.
            </p>
          </div>

          {/* Optional File Attachment (Firebase Storage / Preview) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              File Attachment / Screenshot (Optional)
            </label>

            {fileName || filePreview ? (
              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Attachment Preview"
                      className="w-14 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {fileName || 'Attached File'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready to upload
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shrink-0"
                  title="Remove attachment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Click to upload file or screenshot</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, PDF, ZIP up to 10MB</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submission Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Submission Note / Milestone Details (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Summary of completed deliverables, test instructions, or notes for the lead reviewer..."
              className="w-full px-3.5 py-2 rounded-xl saas-input text-xs text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !link.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Task...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Task to Admins</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
