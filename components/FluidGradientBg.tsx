'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * FluidGradientBg
 * Renders animated blobs using GSAP that produce the fluid-gradient-loop
 * effect (soft morphing colour orbs, continuously shifting).
 */
export default function FluidGradientBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const blobs = gsap.utils.toArray<HTMLElement>('.fg-blob');

      blobs.forEach((blob, i) => {
        const dur   = 8 + i * 2.5;          // stagger durations
        const delay = i * 1.4;

        // Continuous drifting X / Y
        gsap.to(blob, {
          x: `random(-180, 180)`,
          y: `random(-140, 140)`,
          duration: dur,
          delay,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        // Independent scale pulse
        gsap.to(blob, {
          scale: `random(0.75, 1.35)`,
          duration: dur * 0.7,
          delay: delay + 1,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        // Border-radius morph for organic feel
        gsap.to(blob, {
          borderRadius: [
            '60% 40% 55% 45% / 45% 55% 40% 60%',
            '40% 60% 45% 55% / 55% 45% 60% 40%',
            '55% 45% 65% 35% / 35% 65% 45% 55%',
          ][i % 3],
          duration: dur * 0.9,
          delay,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Blob 1 — blue/indigo */}
      <div
        className="fg-blob"
        style={{
          position: 'absolute',
          top: '10%', left: '15%',
          width: 420, height: 420,
          borderRadius: '60% 40% 55% 45% / 45% 55% 40% 60%',
          background: 'radial-gradient(circle at 40% 40%, #6366f1 0%, #818cf8 40%, transparent 70%)',
          opacity: 0.35,
          filter: 'blur(52px)',
          willChange: 'transform',
        }}
      />

      {/* Blob 2 — cyan/teal */}
      <div
        className="fg-blob"
        style={{
          position: 'absolute',
          top: '40%', left: '55%',
          width: 380, height: 380,
          borderRadius: '40% 60% 45% 55% / 55% 45% 60% 40%',
          background: 'radial-gradient(circle at 60% 50%, #06b6d4 0%, #22d3ee 40%, transparent 70%)',
          opacity: 0.32,
          filter: 'blur(60px)',
          willChange: 'transform',
        }}
      />

      {/* Blob 3 — violet/pink */}
      <div
        className="fg-blob"
        style={{
          position: 'absolute',
          top: '55%', left: '20%',
          width: 360, height: 360,
          borderRadius: '55% 45% 65% 35% / 35% 65% 45% 55%',
          background: 'radial-gradient(circle at 50% 60%, #a855f7 0%, #e879f9 40%, transparent 70%)',
          opacity: 0.30,
          filter: 'blur(56px)',
          willChange: 'transform',
        }}
      />

      {/* Blob 4 — rose/orange accent */}
      <div
        className="fg-blob"
        style={{
          position: 'absolute',
          top: '5%', left: '62%',
          width: 300, height: 300,
          borderRadius: '50% 50% 40% 60% / 60% 40% 55% 45%',
          background: 'radial-gradient(circle at 55% 45%, #f43f5e 0%, #fb7185 45%, transparent 70%)',
          opacity: 0.25,
          filter: 'blur(48px)',
          willChange: 'transform',
        }}
      />

      {/* Blob 5 — deep blue anchor */}
      <div
        className="fg-blob"
        style={{
          position: 'absolute',
          top: '30%', left: '35%',
          width: 500, height: 500,
          borderRadius: '45% 55% 60% 40% / 40% 60% 50% 50%',
          background: 'radial-gradient(circle at 50% 50%, #3b82f6 0%, #60a5fa 35%, transparent 65%)',
          opacity: 0.20,
          filter: 'blur(70px)',
          willChange: 'transform',
        }}
      />

      {/* Subtle noise overlay for texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
          opacity: 0.4,
        }}
      />
    </div>
  );
}
