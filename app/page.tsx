import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import {
  CheckCircle2,
  Users,
  FolderKanban,
  MessageSquare,
  Sparkles,
  Rocket,
  Target,
  CheckSquare,
  Calendar,
  Megaphone,
} from 'lucide-react';
import FluidGradientBg from '@/components/FluidGradientBg';
import MinecraftCodeModal from '@/components/MinecraftCodeModal';

// ── Figma asset URLs ───────────────────────────────────────────────────────────
const imgPlanet = 'https://www.figma.com/api/mcp/asset/fb92c6a9-6875-4306-a119-c0be7b2ecbf5.png';
const imgClock = 'https://www.figma.com/api/mcp/asset/73508a96-698b-43de-8806-e39e238f1815.png';

export default function HomePage() {
  const [showCodeModal, setShowCodeModal] = useState(false);
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
  const btnRef = useRef<HTMLButtonElement>(null);

  // App Feature Badges ref elements
  const appBadge1Ref = useRef<HTMLDivElement>(null);
  const appBadge2Ref = useRef<HTMLDivElement>(null);
  const appBadge3Ref = useRef<HTMLDivElement>(null);
  const appBadge4Ref = useRef<HTMLDivElement>(null);

  // Floating Mini Stickers
  const sticker1Ref = useRef<HTMLDivElement>(null);
  const sticker2Ref = useRef<HTMLDivElement>(null);
  const sticker3Ref = useRef<HTMLDivElement>(null);
  const sticker4Ref = useRef<HTMLDivElement>(null);

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
        appBadge1Ref.current,
        appBadge2Ref.current,
        appBadge3Ref.current,
        appBadge4Ref.current,
        sticker1Ref.current,
        sticker2Ref.current,
        sticker3Ref.current,
        sticker4Ref.current,
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

      // 6. Reveal App Feature Badges with staggered pop
      .to([appBadge1Ref.current, appBadge2Ref.current, appBadge3Ref.current, appBadge4Ref.current], {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(1.6)',
      }, '-=0.3')

      // 7. Floating mini stickers pop in
      .to([sticker1Ref.current, sticker2Ref.current, sticker3Ref.current, sticker4Ref.current], {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: 'back.out(2.2)',
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

      // Continuous subtle floating animations for app badges
      gsap.to(appBadge1Ref.current, {
        y: -6,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to(appBadge2Ref.current, {
        y: 6,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5,
      });
      gsap.to(appBadge3Ref.current, {
        y: -5,
        duration: 4.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1,
      });
      gsap.to(appBadge4Ref.current, {
        y: 5,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.8,
      });

      // Subtle float for mini stickers
      gsap.to(sticker1Ref.current, { y: -4, rotation: 8, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to(sticker2Ref.current, { y: 5, rotation: -6, duration: 3.1, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.3 });
      gsap.to(sticker3Ref.current, { y: -5, rotation: 10, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.6 });
      gsap.to(sticker4Ref.current, { y: 4, rotation: -8, duration: 3.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.9 });

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

        /* ── Hero stage (780 × 460, CSS-scaled) ── */
        .lp-stage-wrap {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          min-height: 580px;
        }
        .lp-stage {
          position: relative;
          width: 780px;
          height: 460px;
          background: transparent;
          flex-shrink: 0;
          overflow: visible;
          /* Scale up 1.25× on large screens so content fills viewport */
          transform: scale(1.25);
          transform-origin: center center;
        }

        /* Responsive scale-down */
        @media (max-width: 1080px) {
          .lp-stage { transform: scale(1.08); }
          .lp-stage-wrap { min-height: 500px; }
        }
        @media (max-width: 880px) {
          .lp-stage { transform: scale(0.90); }
          .lp-stage-wrap { min-height: 420px; }
        }
        @media (max-width: 680px) {
          .lp-stage { transform: scale(0.70); }
          .lp-stage-wrap { min-height: 330px; }
        }
        @media (max-width: 500px) {
          .lp-stage { transform: scale(0.50); }
          .lp-stage-wrap { min-height: 240px; }
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

        /* App Feature Badge styling */
        .app-feature-badge {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04);
          transition: all 0.25s ease;
        }
        .app-feature-badge:hover {
          transform: translateY(-3px) scale(1.04);
          border-color: rgba(59, 130, 246, 0.45);
          box-shadow: 0 14px 30px -4px rgba(59, 130, 246, 0.2);
        }

        /* Mini Floating Sticker styling */
        .mini-sticker {
          position: absolute;
          z-index: 14;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
          border: 2px solid #ffffff;
          border-radius: 9999px;
          pointer-events: none;
        }

        /* GET STARTED hover */
        .lp-btn:hover {
          filter: brightness(1.08);
          transform: translateX(-50%) translateY(-2px) !important;
          box-shadow: 0 10px 24px rgba(0, 162, 255, 0.55) !important;
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
            HERO STAGE  780 × 460
        ════════════════════════════════════ */}
        <div className="lp-stage-wrap">
          <div ref={stageRef} className="lp-stage">

            {/* ── APP BADGE 1: Top-Left (Team Workspace) ── */}
            <div
              ref={appBadge1Ref}
              className="app-feature-badge"
              style={{
                position: 'absolute',
                left: 10,
                top: 8,
                zIndex: 12,
                borderRadius: 12,
                padding: '7px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <Users size={15} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.1,
                  }}
                >
                  Team Workspace
                </span>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 9,
                    color: '#10b981',
                    fontWeight: 700,
                  }}
                >
                  ● Active Collaboration
                </span>
              </div>
            </div>

            {/* ── APP BADGE 2: Bottom-Left (Project Milestone) ── */}
            <div
              ref={appBadge2Ref}
              className="app-feature-badge"
              style={{
                position: 'absolute',
                left: 14,
                bottom: 24,
                zIndex: 12,
                borderRadius: 12,
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: '#fdf4ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c026d3',
                }}
              >
                <FolderKanban size={15} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#1e293b',
                    }}
                  >
                    Projects & Kanban
                  </span>
                  <span
                    style={{
                      background: '#fdf4ff',
                      color: '#c026d3',
                      border: '1px solid #f5d0fe',
                      fontSize: 8,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 5,
                    }}
                  >
                    Sprint
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 9,
                    color: '#64748b',
                    fontWeight: 600,
                  }}
                >
                  Track Tasks & Deadlines 🚀
                </span>
              </div>
            </div>

            {/* ── APP BADGE 3: Top-Right (Task Manager Tracker) ── */}
            <div
              ref={appBadge3Ref}
              className="app-feature-badge"
              style={{
                position: 'absolute',
                right: 18,
                top: 14,
                zIndex: 12,
                borderRadius: 12,
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a',
                }}
              >
                <CheckCircle2 size={15} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.1,
                  }}
                >
                  Task Manager
                </span>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 9,
                    color: '#16a34a',
                    fontWeight: 700,
                  }}
                >
                  ⚡ All Tasks On Schedule
                </span>
              </div>
            </div>

            {/* ── APP BADGE 4: Bottom-Right (Daily Updates & Standups) ── */}
            <div
              ref={appBadge4Ref}
              className="app-feature-badge"
              style={{
                position: 'absolute',
                right: 16,
                bottom: 26,
                zIndex: 12,
                borderRadius: 12,
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: '#fffbeb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                }}
              >
                <MessageSquare size={15} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.1,
                  }}
                >
                  Daily Standups
                </span>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 9,
                    color: '#d97706',
                    fontWeight: 700,
                  }}
                >
                  📢 Instant Team Updates
                </span>
              </div>
            </div>

            {/* ── Mini Floating Stickers & App Icons ── */}
            <div
              ref={sticker1Ref}
              className="mini-sticker"
              style={{
                left: 176,
                top: 42,
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #fef08a, #facc15)',
                color: '#854d0e',
              }}
            >
              <Sparkles size={16} />
            </div>

            <div
              ref={sticker2Ref}
              className="mini-sticker"
              style={{
                right: 182,
                top: 56,
                width: 30,
                height: 30,
                background: 'linear-gradient(135deg, #fed7aa, #fb923c)',
                color: '#9a3412',
              }}
            >
              <Target size={15} />
            </div>

            <div
              ref={sticker3Ref}
              className="mini-sticker"
              style={{
                left: 198,
                bottom: 50,
                width: 30,
                height: 30,
                background: 'linear-gradient(135deg, #bfdbfe, #60a5fa)',
                color: '#1e40af',
              }}
            >
              <Rocket size={15} />
            </div>

            <div
              ref={sticker4Ref}
              className="mini-sticker"
              style={{
                right: 192,
                bottom: 48,
                width: 30,
                height: 30,
                background: 'linear-gradient(135deg, #bbf7d0, #4ade80)',
                color: '#166534',
              }}
            >
              <CheckSquare size={15} />
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
                top: 140,
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

            {/* ── Subtext Description (Moved lower with clean spacing) ─────────────────────────── */}
            <p
              ref={subtextRef}
              style={{
                position: 'absolute',
                left: '50%',
                top: 272,
                transform: 'translateX(-50%)',
                width: 380,
                margin: 0,
                fontFamily: "'Sour Gummy', system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 14.5,
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

            {/* ── GET STARTED Button (Positioned gracefully at the bottom) ──────── */}
            <button
              ref={btnRef as any}
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="lp-btn cursor-pointer"
              style={{
                position: 'absolute',
                left: '50%',
                top: 356,
                transform: 'translateX(-50%)',
                width: 174,
                height: 40,
                background: '#00a2ff',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                fontFamily: "'Sour Gummy', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#000',
                fontVariationSettings: '"wdth" 100',
                whiteSpace: 'nowrap',
                boxShadow: '0 6px 18px rgba(0, 162, 255, 0.45)',
                zIndex: 20,
                border: 'none',
              }}
            >
              GET STARTED
            </button>

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

      {/* Minecraft Crafted Access Gatekeeper Modal */}
      <MinecraftCodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        redirectTo="/login"
      />
    </>
  );
}


