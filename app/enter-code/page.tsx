'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ShieldCheck, Lock, Unlock, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Orbit } from 'lucide-react';
import FluidGradientBg from '@/components/FluidGradientBg';

const CORRECT_CODE = 'ORBITFAMILY';

function playSuccessChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.3); // C6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (_) {}
}

export default function EnterCodePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isChecking || isSuccess) return;

    setError('');
    setIsChecking(true);

    const normalized = code.trim().toUpperCase();

    setTimeout(() => {
      if (normalized === CORRECT_CODE) {
        setIsSuccess(true);
        setIsChecking(false);
        playSuccessChime();

        // Grant access in localStorage & cookie (valid for 30 days)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('orbit_access_verified', 'true');
            document.cookie = 'orbit_access_verified=true; path=/; max-age=2592000; SameSite=Lax';
          } catch (_) {}
        }

        // Navigate to login page
        setTimeout(() => {
          router.push('/login');
        }, 1200);
      } else {
        setIsChecking(false);
        setError('Invalid access code. Please enter the correct code: ORBITFAMILY');
        inputRef.current?.focus();
      }
    }, 400);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: '#f8f8ff' }}
    >
      {/* Background Fluid Animation */}
      <FluidGradientBg />

      <div className="relative z-10 w-full max-w-md">
        <div
          className={`bg-white/95 backdrop-blur-xl border rounded-3xl p-7 sm:p-8 shadow-2xl transition-all duration-300 ${
            isSuccess
              ? 'border-emerald-400 ring-4 ring-emerald-500/20 shadow-emerald-500/10'
              : error
              ? 'border-rose-300 ring-4 ring-rose-500/10 shadow-rose-500/10'
              : 'border-slate-200/90 hover:border-blue-300'
          }`}
        >
          {/* Top Logo & Icon */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center justify-center">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-md ${
                  isSuccess
                    ? 'bg-emerald-500 text-white rotate-0 scale-105'
                    : error
                    ? 'bg-rose-500 text-white animate-bounce'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/25'
                }`}
              >
                {isSuccess ? (
                  <Unlock className="w-7 h-7 animate-pulse" />
                ) : (
                  <Lock className="w-7 h-7" />
                )}
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold tracking-wide uppercase mb-2 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                Workspace Security Gate
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Enter Access Code
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                A valid workspace access key is required to enter Orbit.
              </p>
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            {/* Input field */}
            <div className="space-y-1.5">
              <label
                htmlFor="access-code"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between"
              >
                <span>Access Code</span>
                <span className="text-[10px] text-blue-600 lowercase font-medium font-mono">
                  code: ORBITFAMILY
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  ref={inputRef}
                  id="access-code"
                  type="text"
                  required
                  disabled={isSuccess || isChecking}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  placeholder="e.g. ORBITFAMILY"
                  autoComplete="off"
                  spellCheck={false}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-black tracking-widest uppercase transition-all bg-slate-50/70 focus:bg-white placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal ${
                    error
                      ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/20 text-rose-900'
                      : isSuccess
                      ? 'border-emerald-400 text-emerald-900 bg-emerald-50/40'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {isSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 animate-spin" />
                <span>Access Granted! Unlocking Orbit Workspace...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!code.trim() || isChecking || isSuccess}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all duration-200 ${
                isSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isChecking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Key...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Redirecting to Login...</span>
                </>
              ) : (
                <>
                  <span>Unlock Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
            >
              ← Back to Orbit Landing Page
            </Link>
          </div>
        </div>

        {/* Orbit brand watermark */}
        <div className="mt-4 text-center">
          <p className="text-[11px] font-semibold text-slate-400">
            Protected by Orbit Security Gateway • Access Key Required
          </p>
        </div>
      </div>
    </div>
  );
}
