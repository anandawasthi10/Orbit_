'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { ITask } from '@/types';
import { taskSubmissionSchema, TaskSubmissionFormValues } from '@/lib/schemas';
import { useSubmitTask } from '@/hooks/useSubmitTask';

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');

  const submitTaskMutation = useSubmitTask();

  // React Hook Form + Zod Resolver
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskSubmissionFormValues>({
    resolver: zodResolver(taskSubmissionSchema) as any,
    defaultValues: {
      link: '',
      note: '',
      attachmentUrl: '',
    },
  });

  // Initialize or reset form when task opens
  useEffect(() => {
    if (task) {
      const initialLink = task.submissionLink || task.submission?.link || '';
      const initialNote = task.submissionNote || task.submission?.note || '';
      const initialFile = task.submissionFile || task.submission?.screenshotUrl || '';

      setValue('link', initialLink);
      setValue('note', initialNote);
      setValue('attachmentUrl', initialFile);

      setFilePreview(initialFile);
      setFileName(initialFile ? 'Attached File' : '');
      setSelectedFile(null);
      setFileError('');
    }
  }, [task, setValue]);

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
        onComplete: () => {
          reset();
          onClose();
        },
      });
    } else {
      reset();
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size must be under 10MB');
      return;
    }

    setFileError('');
    setSelectedFile(file);
    setFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setFilePreview(preview);
        setValue('attachmentUrl', preview);
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
    setValue('attachmentUrl', '');
  };

  const onSubmit = async (values: TaskSubmissionFormValues) => {
    if (!task) return;

    const taskId = task._id || task.id || '';
    const memberId = sessionUser?.id || sessionUser?._id || 'anonymous';
    const memberName = sessionUser?.name || 'Team Member';

    let fileUrl = values.attachmentUrl || filePreview;

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

      // 2. Submit task via TanStack Query mutation
      await submitTaskMutation.mutateAsync({
        taskId,
        taskTitle: task.title || 'Assigned Task',
        link: values.link.trim(),
        note: values.note ? values.note.trim() : '',
        fileUrl,
        memberId,
        memberName,
      });

      // 3. Optimistic Toast & Callbacks
      if (showToast) {
        showToast('Task submitted successfully! Real-time notification dispatched to admins.');
      }

      if (onSubmitSuccess) {
        onSubmitSuccess({
          ...task,
          status: 'submitted',
          submissionLink: values.link.trim(),
          submissionNote: values.note,
          submissionFile: fileUrl,
        });
      }

      handleClose();
    } catch (err: any) {
      console.error('Task submission error:', err);
    }
  };

  if (!isOpen || !task) return null;

  const isPending = isSubmitting || submitTaskMutation.isPending;

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

        {/* Global Mutation Error Banner */}
        {submitTaskMutation.isError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{(submitTaskMutation.error as any)?.message || 'Failed to submit task. Please try again.'}</span>
          </div>
        )}

        {fileError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Submission URL Field (Required + Zod Validated) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Submission Link *</span>
              <span className="text-[10px] text-slate-400 font-normal normal-case">GitHub / Demo / Drive</span>
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                {...register('link')}
                placeholder="https://github.com/myrepo or https://mydemo.vercel.app"
                className={`w-full pl-9 pr-3.5 py-2 rounded-xl saas-input text-xs text-slate-900 font-semibold placeholder:text-slate-400 ${
                  errors.link ? 'border-rose-400 ring-rose-200 bg-rose-50/20' : ''
                }`}
              />
            </div>
            {errors.link ? (
              <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.link.message}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Provide live preview URL, pull request, Figma link, or repository.
              </p>
            )}
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
              {...register('note')}
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
              disabled={isPending}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
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
