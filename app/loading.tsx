'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 py-12 animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-xl animate-pulse" />
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-blue-600 relative z-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-slate-800 tracking-wider uppercase">Orbit Workspace</p>
        <p className="text-[11px] font-medium text-slate-400">Loading workspace content...</p>
      </div>
    </div>
  );
}
