'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const CORRECT_CODE = 'ORBITFAMILY';

// ── 8-Bit Minecraft Sound Synthesizers ───────────────────────────────────────
function playMinecraftClick() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (_) {}
}

function playMinecraftError() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.setValueAtTime(85, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {}
}

function playMinecraftLevelUp() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C4, E4, G4, C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.07 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.07);
      osc.stop(ctx.currentTime + i * 0.07 + 0.2);
    });
  } catch (_) {}
}

interface MinecraftCodeModalProps {
  isOpen: boolean;
  onClose?: () => void;
  redirectTo?: string;
}

export default function MinecraftCodeModal({
  isOpen,
  onClose,
  redirectTo = '/login',
}: MinecraftCodeModalProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setCode('');
      setError(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isChecking || isSuccess) return;

    playMinecraftClick();
    setError(false);
    setIsChecking(true);

    const normalized = code.trim().toUpperCase();

    setTimeout(() => {
      if (normalized === CORRECT_CODE) {
        setIsSuccess(true);
        setIsChecking(false);
        playMinecraftLevelUp();

        // Save access in localStorage & cookie (30 days)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('orbit_access_verified', 'true');
            document.cookie = 'orbit_access_verified=true; path=/; max-age=2592000; SameSite=Lax';
          } catch (_) {}
        }

        // Teleport to login / destination
        setTimeout(() => {
          router.push(redirectTo);
        }, 1400);
      } else {
        setIsChecking(false);
        setError(true);
        setShake(true);
        playMinecraftError();
        setTimeout(() => setShake(false), 500);
        inputRef.current?.focus();
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      {/* Dark pixelated backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isSuccess && onClose) {
            playMinecraftClick();
            onClose();
          }
        }}
      />

      <style jsx global>{`
        .mc-font {
          font-family: 'Press Start 2P', monospace, sans-serif;
        }
        .mc-gui-box {
          background-color: #c6c6c6;
          box-shadow: inset -4px -4px 0 #555555, inset 4px 4px 0 #ffffff,
            0 0 0 4px #000000, 0 16px 40px rgba(0, 0, 0, 0.9);
          border: 4px solid #dbdbdb;
        }
        .mc-input {
          background-color: #000000;
          color: #ffffff;
          box-shadow: inset 3px 3px 0 #373737, inset -3px -3px 0 #555555,
            0 0 0 2px #000000;
          font-family: 'Press Start 2P', monospace;
          image-rendering: pixelated;
        }
        .mc-btn {
          background-color: #737373;
          color: #e0e0e0;
          box-shadow: inset -3px -3px 0 #373737, inset 3px 3px 0 #ffffff,
            0 0 0 2px #000000;
          font-family: 'Press Start 2P', monospace;
          text-shadow: 2px 2px 0 #222222;
          transition: transform 0.05s ease;
          border: none;
        }
        .mc-btn:hover:not(:disabled) {
          background-color: #8b8b8b;
          color: #ffffa0;
          box-shadow: inset -3px -3px 0 #373737, inset 3px 3px 0 #ffffff,
            0 0 0 2px #000000;
        }
        .mc-btn:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: inset 3px 3px 0 #373737, inset -3px -3px 0 #ffffff,
            0 0 0 2px #000000;
        }
        .mc-btn-success {
          background-color: #2e7d32;
          color: #a7ffeb;
          box-shadow: inset -3px -3px 0 #1b5e20, inset 3px 3px 0 #81c784,
            0 0 0 2px #000000;
          text-shadow: 2px 2px 0 #0f3813;
        }
        @keyframes mcShake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-8px);
          }
          40%,
          80% {
            transform: translateX(8px);
          }
        }
        .animate-mc-shake {
          animation: mcShake 0.4s ease-in-out;
        }
        .mc-chest-bob {
          animation: mcChestBob 2s infinite ease-in-out;
        }
        @keyframes mcChestBob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>

      {/* ── Main Minecraft Crafted Box ────────────────────────────────────── */}
      <div
        className={`w-full max-w-md mc-gui-box p-5 sm:p-7 relative z-10 animate-in zoom-in-95 duration-200 ${
          shake ? 'animate-mc-shake' : ''
        }`}
      >
        {/* Top Close Button */}
        {onClose && !isSuccess && (
          <button
            type="button"
            onClick={() => {
              playMinecraftClick();
              onClose();
            }}
            className="absolute top-2 right-2 w-7 h-7 mc-btn flex items-center justify-center mc-font text-xs cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        )}

        {/* Title Bar Banner */}
        <div
          className="mb-5 p-2.5 text-center"
          style={{
            backgroundColor: isSuccess ? '#1e3a1e' : '#373737',
            boxShadow:
              'inset 2px 2px 0 #222222, inset -2px -2px 0 #555555, 0 0 0 2px #000000',
          }}
        >
          <p
            className="mc-font text-xs uppercase font-bold"
            style={{
              color: isSuccess ? '#55ff55' : '#ffff55',
              textShadow: '2px 2px 0 #000000',
            }}
          >
            {isSuccess ? '★ ACCESS GRANTED ★' : '⚔ ORBIT ACCESS GATE ⚔'}
          </p>
        </div>

        {/* Minecraft Pixel Chest Graphic */}
        <div className="flex flex-col items-center justify-center mb-5 space-y-2.5">
          <div className="relative mc-chest-bob">
            <div
              style={{
                width: 58,
                height: 58,
                backgroundColor: isSuccess ? '#2e7d32' : '#8d5524',
                boxShadow: `
                  inset 4px 4px 0 ${isSuccess ? '#4caf50' : '#c68642'},
                  inset -4px -4px 0 ${isSuccess ? '#1b5e20' : '#4a2505'},
                  0 0 0 3px #000000
                `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Chest Latch Lock */}
              <div
                style={{
                  width: 12,
                  height: 16,
                  backgroundColor: isSuccess ? '#ffff55' : '#e0e0e0',
                  boxShadow:
                    'inset 2px 2px 0 #ffffff, inset -2px -2px 0 #555555, 0 0 0 2px #000000',
                }}
              />
            </div>

            {/* Glowing enchantment sparkles */}
            {isSuccess && (
              <div
                className="absolute -inset-2 pointer-events-none"
                style={{
                  boxShadow: '0 0 24px #4ade80, inset 0 0 12px #22c55e',
                  border: '2px dashed #a7ffeb',
                }}
              />
            )}
          </div>

          <div className="text-center px-2">
            <p
              className="mc-font text-[9.5px] leading-relaxed text-slate-900"
              style={{ textShadow: '1px 1px 0 #ffffff' }}
            >
              {isSuccess
                ? 'CHEST UNLOCKED! ENTERING ORBIT...'
                : 'ENTER ACCESS CODE TO UNLOCK:'}
            </p>
          </div>
        </div>

        {/* ── Minecraft Form ──────────────────────────────────────────────── */}
        <form onSubmit={handleVerify} className="space-y-3.5">
          {/* Key Input Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span
                className="mc-font text-[8.5px] text-slate-800 uppercase"
                style={{ textShadow: '1px 1px 0 #ffffff' }}
              >
                [ KEY CODE ]
              </span>
              <span
                className="mc-font text-[8px] text-blue-900 font-bold"
                style={{ textShadow: '1px 1px 0 #ffffff' }}
              >
                KEY: ORBITFAMILY
              </span>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                required
                disabled={isSuccess || isChecking}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError(false);
                }}
                placeholder="ENTER CODE..."
                autoComplete="off"
                spellCheck={false}
                className="w-full mc-input py-3 px-3.5 text-xs tracking-wider outline-none disabled:opacity-75"
                style={{
                  borderColor: error ? '#ff5555' : isSuccess ? '#55ff55' : '#000000',
                  color: isSuccess ? '#55ff55' : error ? '#ff5555' : '#ffffff',
                }}
              />
            </div>
          </div>

          {/* Status Alerts */}
          {error && (
            <div
              className="p-2 text-center"
              style={{
                backgroundColor: '#8b0000',
                boxShadow:
                  'inset 2px 2px 0 #ff5555, inset -2px -2px 0 #330000, 0 0 0 2px #000000',
              }}
            >
              <p
                className="mc-font text-[8.5px] text-white"
                style={{ textShadow: '1px 1px 0 #000000' }}
              >
                ✖ INVALID KEY! USE: ORBITFAMILY
              </p>
            </div>
          )}

          {isSuccess && (
            <div
              className="p-2 text-center"
              style={{
                backgroundColor: '#1b5e20',
                boxShadow:
                  'inset 2px 2px 0 #81c784, inset -2px -2px 0 #0a3d0e, 0 0 0 2px #000000',
              }}
            >
              <p
                className="mc-font text-[8.5px] text-emerald-200"
                style={{ textShadow: '1px 1px 0 #000000' }}
              >
                ✔ ACCEPTED! TELEPORTING TO LOGIN...
              </p>
            </div>
          )}

          {/* Minecraft Button */}
          <button
            type="submit"
            disabled={!code.trim() || isChecking || isSuccess}
            className={`w-full py-3 px-4 mc-btn text-[10.5px] uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isSuccess ? 'mc-btn-success' : ''
            }`}
          >
            {isChecking
              ? '▶ CRAFTING...'
              : isSuccess
              ? '✔ UNLOCKED!'
              : '▶ UNLOCK WORKSPACE'}
          </button>
        </form>

        {onClose && !isSuccess && (
          <div className="mt-4 pt-2.5 border-t border-slate-400 text-center">
            <button
              type="button"
              onClick={() => {
                playMinecraftClick();
                onClose();
              }}
              className="mc-font text-[8px] text-slate-700 hover:text-slate-900 transition-colors"
              style={{ textShadow: '1px 1px 0 #ffffff' }}
            >
              « CANCEL &amp; RETURN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
