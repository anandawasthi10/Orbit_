import React from 'react';

export default function TechDoodleBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20">
      {/* SVG Pattern: Seamless WhatsApp-style doodle background with modern web tech outline icons */}
      <svg
        className="absolute inset-0 w-full h-full text-slate-400/25 dark:text-slate-600/20 opacity-70 [mask-image:radial-gradient(ellipse_at_center,white_60%,transparent_100%)]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="tech-doodle-pattern"
            x="0"
            y="0"
            width="260"
            height="260"
            patternUnits="userSpaceOnUse"
          >
            {/* --- TOP-LEFT SECTOR --- */}
            {/* React Atom Doodle */}
            <g transform="translate(30, 25) scale(0.75)" stroke="currentColor" strokeWidth="1.4" fill="none">
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(30 12 12)" />
              <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(90 12 12)" />
              <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(150 12 12)" />
            </g>

            {/* Next.js N Logo */}
            <g transform="translate(110, 20) scale(0.7)" stroke="currentColor" strokeWidth="1.5" fill="none">
              <circle cx="12" cy="12" r="11" />
              <path d="M9 7v10M15 7v10M9 7l6 10" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* HTML Code Brackets </> */}
            <g transform="translate(195, 30) scale(0.75)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none">
              <path d="M6 8l-4 4 4 4M18 8l4 4-4 4M14 6l-4 12" />
            </g>

            {/* Small Sparkle */}
            <path d="M75 60 L77 65 L82 67 L77 69 L75 74 L73 69 L68 67 L73 65 Z" fill="currentColor" opacity="0.6" />

            {/* --- UPPER-MID SECTOR --- */}
            {/* Tailwind CSS Waves */}
            <g transform="translate(20, 105) scale(0.7)" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round">
              <path d="M2 10c3-5 7-6 10-2s7 3 10-2M2 18c3-5 7-6 10-2s7 3 10-2" />
            </g>

            {/* TypeScript TS Box */}
            <g transform="translate(100, 95) scale(0.7)" stroke="currentColor" strokeWidth="1.4" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" />
              <path d="M5 8h6M8 8v9M13 14c1 2 4 2 4 0s-3-1-3-3 3-3 4-1" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Vercel Triangle */}
            <g transform="translate(190, 100) scale(0.75)" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M12 3L22 20H2L12 3Z" />
            </g>

            {/* Orbit Ring Doodle */}
            <g transform="translate(150, 60) scale(0.65)" stroke="currentColor" strokeWidth="1.4" fill="none">
              <circle cx="12" cy="12" r="5" />
              <ellipse cx="12" cy="12" rx="13" ry="4" transform="rotate(-25 12 12)" />
            </g>

            {/* --- MID-LOWER SECTOR --- */}
            {/* Git Node Branching */}
            <g transform="translate(45, 170) scale(0.75)" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
              <circle cx="6" cy="6" r="2.5" />
              <circle cx="6" cy="18" r="2.5" />
              <circle cx="18" cy="12" r="2.5" />
              <path d="M6 8.5v7M8.5 6c4 0 6 3 7 3.5M8.5 18c4 0 6-3 7-3.5" />
            </g>

            {/* Terminal Box Prompt */}
            <g transform="translate(125, 165) scale(0.7)" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
              <rect x="2" y="3" width="20" height="18" rx="4" />
              <path d="M6 9l3 3-3 3M12 15h4" />
            </g>

            {/* Database Stack */}
            <g transform="translate(205, 170) scale(0.7)" stroke="currentColor" strokeWidth="1.4" fill="none">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v6c0 1.6 4 3 9 3s9-1.4 9-3V5M3 11v6c0 1.6 4 3 9 3s9-1.4 9-3v-6" strokeLinecap="round" />
            </g>

            {/* JavaScript {JS} Curly Braces */}
            <g transform="translate(80, 220) scale(0.75)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none">
              <path d="M6 4c-2 0-3 1-3 3v2c0 1.5-1 2-2 2 1 0 2 .5 2 2v2c0 2 1 3 3 3M18 4c2 0 3 1 3 3v2c0 1.5 1 2 2 2-1 0-2 .5-2 2v2c0 2-1 3-3 3" />
            </g>

            {/* Lightning Bolt */}
            <g transform="translate(165, 215) scale(0.75)" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none">
              <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
            </g>

            {/* GitHub Octocat Ear outline / Cat silhouette */}
            <g transform="translate(10, 225) scale(0.65)" stroke="currentColor" strokeWidth="1.4" fill="none">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.3-3.4-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 1-.3 2-.4 3-.4s2 .1 3 .4c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.7.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0022 12c0-5.5-4.5-10-10-10z" />
            </g>

            {/* Organic Subtle Dots & Plus Doodles to fill empty space naturally like WhatsApp */}
            <circle cx="50" cy="80" r="1.5" fill="currentColor" opacity="0.5" />
            <circle cx="210" cy="70" r="1.2" fill="currentColor" opacity="0.4" />
            <circle cx="160" cy="135" r="1.5" fill="currentColor" opacity="0.5" />
            <circle cx="25" cy="150" r="1.2" fill="currentColor" opacity="0.4" />
            <circle cx="240" cy="225" r="1.5" fill="currentColor" opacity="0.5" />
            <path d="M140 105 v4 m-2 -2 h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
            <path d="M225 140 v4 m-2 -2 h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
            <path d="M15 50 v4 m-2 -2 h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tech-doodle-pattern)" />
      </svg>
    </div>
  );
}
