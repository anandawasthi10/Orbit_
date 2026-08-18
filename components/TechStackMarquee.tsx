'use client';

import React from 'react';

interface TechItem {
  name: string;
  icon: React.ReactNode;
}

const TECH_ITEMS: TechItem[] = [
  {
    name: 'Next.js',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 128 128" fill="none">
        <circle cx="64" cy="64" r="64" fill="#000000" />
        <path
          d="M107.5 111.8L47.7 34.5H35v59.1h10.9V49.3l52.3 67.8c3.2-1.6 6.3-3.4 9.3-5.3z"
          fill="url(#next_grad)"
        />
        <path d="M82.2 34.5h10.9v59.1H82.2z" fill="#FFFFFF" />
        <defs>
          <linearGradient id="next_grad" x1="77" y1="64" x2="105" y2="108" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: 'React JS',
    icon: (
      <svg className="w-8 h-8 animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="10" fill="#61DAFB" />
        <ellipse cx="50" cy="50" rx="38" ry="14" stroke="#61DAFB" strokeWidth="4" />
        <ellipse cx="50" cy="50" rx="38" ry="14" stroke="#61DAFB" strokeWidth="4" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="14" stroke="#61DAFB" strokeWidth="4" transform="rotate(120 50 50)" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    icon: (
      <svg className="w-8 h-8 text-slate-900 fill-current" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    name: 'Vercel',
    icon: (
      <svg className="w-8 h-8 text-black fill-current" viewBox="0 0 512 512">
        <path d="M256 48L512 464H0L256 48Z" />
      </svg>
    ),
  },
  {
    name: 'HTML5',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 128 128">
        <path fill="#E44D26" d="M18.8 114.7L9.5 10.7h109l-9.3 104L63.8 128z" />
        <path fill="#F16529" d="M64 117.7l37.2-10.3 8.3-93.1H64z" />
        <path fill="#EBEBEB" d="M64 54.3H43.9l-1.4-16H64V24.8H26.5l.4 4.8 3.8 42.6H64zm0 47.9l-.2.1-20.9-5.6-1.3-15h-13.5l2.6 29.5 33.1 9.2.2-.1z" />
        <path fill="#FFFFFF" d="M63.8 54.3h20.1l-1.9 21.3-18.2 4.9v13.8l33.1-9.2 3.6-40.4H63.8zm0-29.5h39.9l-.4-4.8H63.8z" />
      </svg>
    ),
  },
  {
    name: 'CSS3',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 128 128">
        <path fill="#1572B6" d="M18.8 114.7L9.5 10.7h109l-9.3 104L63.8 128z" />
        <path fill="#33A9DC" d="M64 117.7l37.2-10.3 8.3-93.1H64z" />
        <path fill="#EBEBEB" d="M64 54.3H43.9l-1.4-16H64V24.8H26.5l.4 4.8 3.8 42.6H64zM43.2 73.1l1.3 15 19.5 5.3V107l-.2.1-33.1-9.2-2.6-29.5h13.5z" />
        <path fill="#FFFFFF" d="M63.8 73.1h18.2l-1.9 21.3-16.3 4.4v13.7l33.1-9.2 3.6-40.4H63.8zm0-48.3v13.5h38.4l1-13.5z" />
      </svg>
    ),
  },
  {
    name: 'JavaScript',
    icon: (
      <svg className="w-8 h-8 rounded-md" viewBox="0 0 128 128">
        <path fill="#F7DF1E" d="M0 0h128v128H0z" />
        <path
          fill="#000000"
          d="M67.3 103.9c2.4 3.9 6.2 6.6 11.7 6.6 4.9 0 8.5-2.4 8.5-5.9 0-4.1-3.3-5.6-8.9-8l-3.1-1.3c-9.1-3.9-15-8.8-15-19.1 0-9.5 7.3-16.8 18.6-16.8 8.1 0 13.9 2.8 17.8 9.6l-8.5 5.5c-2.1-3.6-4.9-5.1-9.3-5.1-4.2 0-7.2 2.7-7.2 5.5 0 3.7 2.4 5.1 7.6 7.4l3.1 1.3c10.8 4.6 16.5 9.4 16.5 19.9 0 11.4-8.9 17.6-20.7 17.6-11.6 0-18.7-5.6-22.7-12.7l9.6-5.5zm-37.1 1.7c2 3.5 4.6 6.5 9.3 6.5 4.7 0 7.7-1.9 7.7-9.3V59.9h12.5v43.2c0 14.1-8.3 20.3-20.1 20.3-10.7 0-16.9-5.5-20.1-12.3l10.7-5.5z"
        />
      </svg>
    ),
  },
  {
    name: 'Tailwind CSS',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 128 128">
        <path
          fill="#06B6D4"
          d="M32 32c10.7 0 18.7 5.3 24 16 5.3-16 16-21.3 32-21.3 16 0 24 10.7 24 32 0 4.3-.7 8.9-2.1 13.7C104.5 57 96.5 51.7 91.2 51.7c-5.3 0-10.7 2.7-16 8-10.7 10.7-18.7 32-43.2 32-10.7 0-18.7-5.3-24-16C2.7 91.7-5.3 97 2.7 75.7c0-21.3 13.3-43.7 29.3-43.7zm32 32c10.7 0 18.7 5.3 24 16 5.3-16 16-21.3 32-21.3 16 0 24 10.7 24 32 0 4.3-.7 8.9-2.1 13.7-5.4-15.4-13.4-20.7-18.7-20.7-5.3 0-10.7 2.7-16 8-10.7 10.7-18.7 32-43.2 32-10.7 0-18.7-5.3-24-16C34.7 123.7 26.7 129 34.7 107.7c0-21.3 13.3-43.7 29.3-43.7z"
        />
      </svg>
    ),
  },
  {
    name: 'TypeScript',
    icon: (
      <svg className="w-8 h-8 rounded-md" viewBox="0 0 128 128">
        <path fill="#3178C6" d="M0 0h128v128H0z" />
        <path
          fill="#FFFFFF"
          d="M74.8 77.2c2.4 3.9 6.2 6.6 11.7 6.6 4.9 0 8.5-2.4 8.5-5.9 0-4.1-3.3-5.6-8.9-8l-3.1-1.3c-9.1-3.9-15-8.8-15-19.1 0-9.5 7.3-16.8 18.6-16.8 8.1 0 13.9 2.8 17.8 9.6l-8.5 5.5c-2.1-3.6-4.9-5.1-9.3-5.1-4.2 0-7.2 2.7-7.2 5.5 0 3.7 2.4 5.1 7.6 7.4l3.1 1.3c10.8 4.6 16.5 9.4 16.5 19.9 0 11.4-8.9 17.6-20.7 17.6-11.6 0-18.7-5.6-22.7-12.7l9.6-5.5zM22 43.1h42.1v12.2H49.1v56.5H36.9V55.3H22V43.1z"
        />
      </svg>
    ),
  },
];

// Duplicate items for continuous seamless loop
const MARQUEE_ITEMS = [...TECH_ITEMS, ...TECH_ITEMS, ...TECH_ITEMS];

export default function TechStackMarquee() {
  return (
    <div className="w-full py-8 overflow-hidden relative">
      {/* Section Label */}
      <div className="text-center mb-6">
        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200/80 px-3.5 py-1 rounded-full">
          Powered By Modern Technologies
        </span>
      </div>

      {/* Infinite Horizontal Ticker Wrapper */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="animate-marquee flex items-center gap-6 py-2">
          {MARQUEE_ITEMS.map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-2xl px-6 py-4 shadow-sm hover:shadow-md hover:border-blue-300 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-2 min-w-[125px] shrink-0 group cursor-pointer"
            >
              <div className="p-1 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <span className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
