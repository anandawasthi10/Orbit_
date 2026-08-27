'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import {
  Activity,
  GitBranch,
  CheckCircle2,
  Users,
  Zap,
  Radio,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import FluidGradientBg from '@/components/FluidGradientBg';

// ── Figma asset URLs ───────────────────────────────────────────────────────────
const imgPlanet = 'https://www.figma.com/api/mcp/asset/fb92c6a9-6875-4306-a119-c0be7b2ecbf5.png';
const imgClock = 'https://www.figma.com/api/mcp/asset/73508a96-698b-43de-8806-e39e238f1815.png';

export default function HomePage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const reminderWrapRef = useRef<HTMLDivElement>(null);
  const yellowNoteWrapRef = useRef<HTMLDivElement>(null);
  const redPinRef = useRef<HTMLDivElement>(null);
  const clockIconRef = useRef<HTMLDivElement>(null);
  const orbitTitleRef = useRef<HTMLHeadingElement>(null);
  const headlineRef = useRef<HTMLParagraphElement>(null);
  const planetRef = useRef<HTMLDivElement>(null);
  const orbitalRingRef = useRef<HTMLDivElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);

  // Technical HUD ref elements
  const techBadge1Ref = useRef<HTMLDivElement>(null);
  const techBadge2Ref = useRef<HTMLDivElement>(null);
  const techBadge3Ref = useRef<HTMLDivElement>(null);
  const techBadge4Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stageRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Set initial states for entrance sequence
      gsap.set([
        orbitTitleRef.current,
        headlineRef.current,
        planetRef.current,
        subtextRef.current,
        btnRef.current,
        techBadge1Ref.current,
        techBadge2Ref.current,
        techBadge3Ref.current,
        techBadge4Ref.current,
      ], { opacity: 0, y: 20 });

      gsap.set(reminderWrapRef.current, {
        opacity: 0,
        x: 140,
        y: -50,
        rotation: 18,
        scale: 0.8,
      });

      gsap.set(clockIconRef.current, {
        scale: 0,
        rotation: -120,
      });

      gsap.set(yellowNoteWrapRef.current, {
        opacity: 0,
        x: -120,
        y: -60,
        rotation: -25,
        scale: 0.75,
      });

      gsap.set(redPinRef.current, {
        scale: 0,
        y: -15,
      });

      // 2. FIRST: Reminder card list attaches and settles into place
      tl.to(reminderWrapRef.current, {
        opacity: 1,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: 0.85,
        ease: 'back.out(1.6)',
      })
      .to(clockIconRef.current, {
        scale: 1,
        rotation: 0,
        duration: 0.45,
        ease: 'back.out(2.5)',
      }, '-=0.35')

      // 3. THEN: Yellow sticky note flies in and sticks with a pin pop
      .to(yellowNoteWrapRef.current, {
        opacity: 1,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: 0.8,
        ease: 'elastic.out(1, 0.55)',
      }, '-=0.2')
      .to(redPinRef.current, {
        scale: 1,
        y: 0,
        duration: 0.35,
        ease: 'back.out(3.5)',
      }, '-=0.35')

      // 4. ORBIT enlarged heading pops in with prominence
      .to(orbitTitleRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.65,
        ease: 'back.out(2)',
      }, '-=0.45')

      // 5. Headline, Planet Logo, Subtext & CTA Button reveal
      .to(headlineRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
      }, '-=0.35')
      .to(planetRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        ease: 'back.out(1.5)',
      }, '-=0.3')
      .to(subtextRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.4,
      }, '-=0.25')
      .to(btnRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'back.out(1.8)',
      }, '-=0.2')

      // 6. Reveal Technical Teamwork Badges with staggered pop
      .to([techBadge1Ref.current, techBadge2Ref.current, techBadge3Ref.current, techBadge4Ref.current], {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(1.6)',
      }, '-=0.3');

      // Continuous Orbital Ring Rotation
      if (orbitalRingRef.current) {
        gsap.to(orbitalRingRef.current, {
          rotation: 360,
          duration: 24,
          repeat: -1,
          ease: 'none',
        });
      }

      // Continuous subtle floating animations for technical badges
      gsap.to(techBadge1Ref.current, {
        y: -6,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to(techBadge2Ref.current, {
        y: 6,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5,
      });
      gsap.to(techBadge3Ref.current, {
        y: -5,
        duration: 4.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1,
      });
      gsap.to(techBadge4Ref.current, {
        y: 5,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.8,
      });

    }, stageRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Kumbh+Sans:wght@700&family=Plus+Jakarta+Sans:wght@600;700;800&family=Potta+One&family=Roboto:wght@700&family=Rubik+Doodle+Shadow&family=Sour+Gummy:ital,wght@0,400;0,700;0,800;1,400;1,800&display=swap');

        /* ── Outer wrapper ── */
        .lp-wrap {
          min-height: 100vh;
          width: 100%;
          background: #f4f5fd;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          position: relative;
        }

        /* ── Hero stage (fixed 780 × 420, CSS-scaled) ── */
        .lp-stage-wrap {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          min-height: 540px;
        }
        .lp-stage {
          position: relative;
          width: 780px;
          height: 420px;
          background: transparent;
          flex-shrink: 0;
          overflow: visible;
          /* Scale up 1.30× on large screens so content fills viewport */
          transform: scale(1.30);
          transform-origin: center center;
        }

        /* Responsive scale-down */
        @media (max-width: 1080px) {
          .lp-stage { transform: scale(1.12); }
          .lp-stage-wrap { min-height: 460px; }
        }
        @media (max-width: 880px) {
          .lp-stage { transform: scale(0.92); }
          .lp-stage-wrap { min-height: 380px; }
        }
        @media (max-width: 680px) {
          .lp-stage { transform: scale(0.72); }
          .lp-stage-wrap { min-height: 290px; }
        }
        @media (max-width: 500px) {
          .lp-stage { transform: scale(0.52); }
          .lp-stage-wrap { min-height: 210px; }
        }

        /* Floating idle animations */
        @keyframes lp-float-note {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50%      { transform: translateY(-7px) rotate(-2deg); }
        }
        @keyframes lp-float-card {
          0%, 100% { transform: translateY(0px) rotate(4deg); }
          50%      { transform: translateY(-6px) rotate(5.5deg); }
        }
        .lp-float-note { animation: lp-float-note 5s ease-in-out infinite; }
        .lp-float-card { animation: lp-float-card 4.5s ease-in-out infinite; }

        /* Technical pulse effects */
        @keyframes radar-pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .radar-ring {
          animation: radar-pulse 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        /* Technical HUD Badge styling */
        .tech-hud-badge {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04);
          transition: all 0.25s ease;
        }
        .tech-hud-badge:hover {
          transform: translateY(-2px) scale(1.03);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 14px 30px -4px rgba(59, 130, 246, 0.16);
        }

        /* GET STARTED hover */
        .lp-btn:hover {
          filter: brightness(1.08);
          transform: translateX(-50%) translateY(-2px) !important;
          box-shadow: 0 8px 22px rgba(0, 162, 255, 0.5) !important;
        }
        .lp-btn:active {
          transform: translateX(-50%) translateY(0px) !important;
        }
        .lp-btn { transition: filter 0.2s, transform 0.2s, box-shadow 0.2s; }
      `}</style>

      <div className="lp-wrap">
        {/* Fluid gradient blob animation background */}
        <FluidGradientBg />

        {/* ════════════════════════════════════
            HERO STAGE  780 × 420
        ════════════════════════════════════ */}
        <div className="lp-stage-wrap">
          <div ref={stageRef} className="lp-stage">

            {/* ── TECHNICAL TEAMWORK HUD: Top-Left (Live Sync & Active Devs) ── */}
            <div
              ref={techBadge1Ref}
              className="tech-hud-badge"
              style={{
                position: 'absolute',
                left: 10,
                top: 8,
                zIndex: 12,
                borderRadius: 10,
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ position: 'relative', width: 8, height: 8 }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
                <span
                  className="radar-ring"
                  style={{
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.1,
                  }}
                >
                  6 Devs Collaborating
                </span>
                <span
                  style={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: 8.5,
                    color: '#10b981',
                    fontWeight: 600,
                  }}
                >
                  ● Live Sync Active
                </span>
              </div>
            </div>

            {/* ── TECHNICAL TEAMWORK HUD: Bottom-Left (Git & Pipeline Engine) ── */}
            <div
              ref={techBadge2Ref}
              className="tech-hud-badge"
              style={{
                position: 'absolute',
                left: 14,
                bottom: 22,
                zIndex: 12,
                borderRadius: 10,
                padding: '7px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <GitBranch size={13} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "'Fira Code', monospace",
                      fontSize: 9.5,
                      fontWeight: 600,
                      color: '#1e293b',
                    }}
                  >
                    branch: main
                  </span>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: 7.5,
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 4,
                    }}
                  >
                    CI/CD PASS
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 8.5,
                    color: '#64748b',
                  }}
                >
                  24 commits merged today
                </span>
              </div>
            </div>

            {/* ── TECHNICAL TEAMWORK HUD: Top-Right (Sprint Velocity) ── */}
            <div
              ref={techBadge3Ref}
              className="tech-hud-badge"
              style={{
                position: 'absolute',
                right: 18,
                top: 14,
                zIndex: 12,
                borderRadius: 10,
                padding: '6px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                }}
              >
                <Activity size={13} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.1,
                  }}
                >
                  Sprint Velocity 98.4%
                </span>
                <span
                  style={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: 8,
                    color: '#64748b',
                  }}
                >
                  ⚡ Real-time Kanban
                </span>
              </div>
            </div>

            {/* ── TECHNICAL TEAMWORK HUD: Bottom-Right (RTDB Latency) ── */}
            <div
              ref={techBadge4Ref}
              className="tech-hud-badge"
              style={{
                position: 'absolute',
                right: 16,
                bottom: 24,
                zIndex: 12,
                borderRadius: 10,
                padding: '7px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a',
                }}
              >
                <Zap size={13} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.1,
                  }}
                >
                  Firestore RTDB
                </span>
                <span
                  style={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: 8.5,
                    color: '#16a34a',
                    fontWeight: 600,
                  }}
                >
                  12ms live latency
                </span>
              </div>
            </div>

            {/* ── Yellow Sticky Note (Centered Text & Proper Proportions) ── */}
            <div
              ref={yellowNoteWrapRef}
              style={{
                position: 'absolute',
                left: 36,
                top: 66,
                zIndex: 15,
                transformOrigin: 'top right',
              }}
            >
              <div
                className="lp-float-note"
                style={{
                  width: 146,
                  height: 162,
                  background: '#ffd30e',
                  borderRadius: 3,
                  boxShadow: '3px 8px 20px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.08)',
                  overflow: 'visible',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 12px 14px',
                  textAlign: 'center',
                }}
              >
                {/* Red pin dot - centered top */}
                <div
                  ref={redPinRef}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 8,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #ff4d4d, #d60000)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.35)',
                    zIndex: 2,
                  }}
                />

                {/* Sticky note message text: PERFECTLY CENTERED */}
                <p
                  style={{
                    fontFamily: "'Potta One', system-ui, sans-serif",
                    fontSize: 12.5,
                    lineHeight: 1.42,
                    color: '#000',
                    margin: 0,
                    textAlign: 'center',
                    letterSpacing: '-0.2px',
                    width: '100%',
                  }}
                >
                  Great ideas<br />
                  starts with clear<br />
                  plans and<br />
                  better teamwork
                </p>
              </div>
            </div>

            {/* ── ENLARGED ORBIT Wordmark Heading ──────────────────── */}
            <h1
              ref={orbitTitleRef}
              style={{
                position: 'absolute',
                left: '50%',
                top: 6,
                transform: 'translateX(-50%)',
                margin: 0,
                fontFamily: "'Rubik Doodle Shadow', system-ui, sans-serif",
                fontSize: 56,
                lineHeight: 1,
                color: '#ff001a',
                textShadow: '0px 4px 6px rgba(0,0,0,0.22), 0 0 24px rgba(255,0,26,0.18)',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                letterSpacing: '2px',
                zIndex: 10,
              }}
            >
              ORBIT
            </h1>

            {/* ── Headline — ASSIGN, TRACK AND DELIVER ────────────────── */}
            <p
              ref={headlineRef}
              style={{
                position: 'absolute',
                left: '50%',
                top: 70,
                transform: 'translateX(-50%)',
                width: 440,
                margin: 0,
                fontFamily: "'Sour Gummy', system-ui, sans-serif",
                fontWeight: 800,
                fontSize: 28,
                lineHeight: 1.2,
                color: '#000',
                fontVariationSettings: '"wdth" 100',
                textAlign: 'center',
                zIndex: 10,
              }}
            >
              {'ASSIGN,TRACK AND '}
              <span style={{ color: '#ff002f' }}>DELIVER</span>
            </p>

            {/* ── Planet Logo & Orbital Tech Aura ──────────────────────── */}
            <div
              ref={planetRef}
              style={{
                position: 'absolute',
                left: '50%',
                top: 144,
                transform: 'translateX(-50%)',
                width: 106,
                height: 96,
                zIndex: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Animated Technical Orbital Ring */}
              <div
                ref={orbitalRingRef}
                style={{
                  position: 'absolute',
                  width: 136,
                  height: 136,
                  borderRadius: '50%',
                  border: '1.5px dashed rgba(59, 130, 246, 0.4)',
                  pointerEvents: 'none',
                }}
              >
                {/* Orbiting Satellite Tech Node */}
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#3b82f6',
                    boxShadow: '0 0 10px #3b82f6, 0 0 20px #60a5fa',
                  }}
                />
              </div>

              <img
                src={imgPlanet}
                alt="Orbit planet"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* ── Subtext Description ─────────────────────────── */}
            <p
              ref={subtextRef}
              style={{
                position: 'absolute',
                left: '50%',
                top: 246,
                transform: 'translateX(-50%)',
                width: 360,
                margin: 0,
                fontFamily: "'Sour Gummy', system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: 1.5,
                color: '#0c0c0c',
                fontVariationSettings: '"wdth" 100',
                textAlign: 'center',
                zIndex: 10,
              }}
            >
              Plan Projects, Manage Tasks, and collaborate{' '}
              seamlessly all in one powerful workspace
            </p>

            {/* ── GET STARTED Button ──────── */}
            <Link
              ref={btnRef}
              href="/signup"
              className="lp-btn"
              style={{
                position: 'absolute',
                left: '50%',
                top: 310,
                transform: 'translateX(-50%)',
                width: 164,
                height: 36,
                background: '#00a2ff',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                fontFamily: "'Sour Gummy', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: '#000',
                fontVariationSettings: '"wdth" 100',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(0, 162, 255, 0.4)',
                zIndex: 20,
              }}
            >
              GET STARTED
            </Link>

            {/* ── Reminders Card (Animates FIRST and attaches) ──────── */}
            <div
              ref={reminderWrapRef}
              style={{
                position: 'absolute',
                right: 36,
                top: 86,
                zIndex: 15,
                transformOrigin: 'top left',
              }}
            >
              <div
                className="lp-float-card"
                style={{
                  width: 156,
                  height: 194,
                  background: '#fe7f49',
                  borderRadius: 8,
                  boxShadow: '3px 8px 22px rgba(0,0,0,0.18)',
                  padding: '12px 12px 14px',
                  position: 'relative',
                }}
              >
                {/* Reminders label */}
                <p
                  style={{
                    fontFamily: "'Roboto', 'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    color: '#fffcfc',
                    margin: '0 0 8px',
                  }}
                >
                  Reminders
                </p>

                {/* Inner note */}
                <div
                  style={{
                    background: '#f9a4a4',
                    borderRadius: 4,
                    padding: '9px 8px 11px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Kumbh Sans', 'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#000',
                      lineHeight: 1.3,
                      margin: '0 0 6px',
                    }}
                  >
                    Todays meet schedule
                  </p>
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: '#004cff',
                      lineHeight: 1.2,
                      margin: 0,
                    }}
                  >
                    2:50 - 3:30
                  </p>
                </div>

                {/* Clock icon with bounce entrance */}
                <div
                  ref={clockIconRef}
                  style={{
                    position: 'absolute',
                    bottom: -16,
                    right: -16,
                    width: 44,
                    height: 44,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                  }}
                >
                  <img
                    src={imgClock}
                    alt="clock"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
            </div>

          </div>{/* end .lp-stage */}
        </div>{/* end .lp-stage-wrap */}

      </div>{/* end .lp-wrap */}
    </>
  );
}
