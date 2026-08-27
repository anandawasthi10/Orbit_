'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import FluidGradientBg from '@/components/FluidGradientBg';

// ── Figma asset URLs (node 3:8 and 1:37) ──────────────────────────────────
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
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);

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
      ], { opacity: 0, y: 20 });

      gsap.set(reminderWrapRef.current, {
        opacity: 0,
        x: 160,
        y: -60,
        rotation: 22,
        scale: 0.75,
      });

      gsap.set(clockIconRef.current, {
        scale: 0,
        rotation: -120,
      });

      gsap.set(yellowNoteWrapRef.current, {
        opacity: 0,
        x: -140,
        y: -80,
        rotation: -30,
        scale: 0.7,
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
      }, '-=0.2');

    }, stageRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kumbh+Sans:wght@700&family=Plus+Jakarta+Sans:wght@700&family=Potta+One&family=Roboto:wght@700&family=Rubik+Doodle+Shadow&family=Sour+Gummy:ital,wght@0,400;0,700;0,800;1,400;1,800&display=swap');

        /* ── Outer wrapper ── */
        .lp-wrap {
          min-height: 100vh;
          width: 100%;
          background: #f5f4ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          position: relative;
        }

        /* ── Hero stage (fixed 711 × 372, CSS-scaled) ── */
        .lp-stage-wrap {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          min-height: 502px;
        }
        .lp-stage {
          position: relative;
          width: 711px;
          height: 372px;
          background: transparent;
          flex-shrink: 0;
          overflow: visible;
          /* Scale up 1.35× on large screens so content fills the viewport */
          transform: scale(1.35);
          transform-origin: center center;
        }

        /* Responsive scale-down */
        @media (max-width: 980px) {
          .lp-stage { transform: scale(1.10); }
          .lp-stage-wrap { min-height: 410px; }
        }
        @media (max-width: 800px) {
          .lp-stage { transform: scale(0.90); }
          .lp-stage-wrap { min-height: 335px; }
        }
        @media (max-width: 650px) {
          .lp-stage { transform: scale(0.70); }
          .lp-stage-wrap { min-height: 260px; }
        }
        @media (max-width: 480px) {
          .lp-stage { transform: scale(0.50); }
          .lp-stage-wrap { min-height: 188px; }
        }

        /* Floating idle animations */
        @keyframes lp-float-note {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50%      { transform: translateY(-7px) rotate(-3.5deg); }
        }
        @keyframes lp-float-card {
          0%, 100% { transform: translateY(0px) rotate(5deg); }
          50%      { transform: translateY(-6px) rotate(6.5deg); }
        }
        .lp-float-note { animation: lp-float-note 5s ease-in-out infinite; }
        .lp-float-card { animation: lp-float-card 4s ease-in-out infinite; }

        /* GET STARTED hover */
        .lp-btn:hover {
          filter: brightness(1.08);
          transform: translateX(-50%) translateY(-2px) !important;
          box-shadow: 0 6px 18px rgba(0, 162, 255, 0.45) !important;
        }
        .lp-btn:active {
          transform: translateX(-50%) translateY(0px) !important;
        }
        .lp-btn { transition: filter 0.2s, transform 0.2s, box-shadow 0.2s; }
      `}</style>

      <div className="lp-wrap">
        {/* Fluid gradient blob animation behind everything */}
        <FluidGradientBg />

        {/* ════════════════════════════════════
            HERO STAGE  711 × 372
        ════════════════════════════════════ */}
        <div className="lp-stage-wrap">
          <div ref={stageRef} className="lp-stage">

            {/* ── Yellow Sticky Note (Animates & sticks after Reminders) ── */}
            <div
              ref={yellowNoteWrapRef}
              style={{
                position: 'absolute',
                left: 12,
                top: 22,
                zIndex: 15,
                transformOrigin: 'top right',
              }}
            >
              <div
                className="lp-float-note"
                style={{
                  width: 130,
                  height: 150,
                  background: '#ffd30e',
                  borderRadius: 2,
                  boxShadow: '2px 4px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)',
                  overflow: 'visible',
                  position: 'relative',
                }}
              >
                {/* Red pin dot */}
                <div
                  ref={redPinRef}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #ff4d4d, #d60000)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />

                {/* Sticky note message text */}
                <p
                  style={{
                    fontFamily: "'Potta One', system-ui, sans-serif",
                    fontSize: 13,
                    lineHeight: 1.45,
                    color: '#000',
                    margin: '20px 10px 0 10px',
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
                top: 2,
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
                top: 66,
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

            {/* ── Planet Logo ──────────────────────── */}
            <div
              ref={planetRef}
              style={{
                position: 'absolute',
                left: '50%',
                top: 136,
                transform: 'translateX(-50%)',
                width: 106,
                height: 96,
                zIndex: 5,
              }}
            >
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
                top: 226,
                transform: 'translateX(-50%)',
                width: 350,
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
                top: 286,
                transform: 'translateX(-50%)',
                width: 160,
                height: 34,
                background: '#00a2ff',
                borderRadius: 4,
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
                boxShadow: '0 4px 12px rgba(0, 162, 255, 0.35)',
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
                left: 546,
                top: 92,
                zIndex: 15,
                transformOrigin: 'top left',
              }}
            >
              <div
                className="lp-float-card"
                style={{
                  width: 154,
                  height: 190,
                  background: '#fe7f49',
                  borderRadius: 8,
                  boxShadow: '3px 6px 18px rgba(0,0,0,0.18)',
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
