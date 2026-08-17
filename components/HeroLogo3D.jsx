'use client';

export default function HeroLogo3D() {
  return (
    <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center relative select-none">
      {/* Outer Subtle Rotating Ring */}
      <div className="absolute -inset-3 rounded-full border border-dashed border-blue-500/30 animate-[spin_20s_linear_infinite]" />

      {/* Counter-rotating Orbit Ring with Luminous Satellite Dots */}
      <div className="absolute -inset-1 rounded-full border border-indigo-500/20 animate-[spin_28s_linear_infinite_reverse]">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
      </div>

      {/* Static Crisp Orbit Logo */}
      <img
        src="/orbit-logo.png"
        alt="Orbit Logo"
        className="w-full h-full object-contain filter drop-shadow-[0_10px_28px_rgba(37,99,235,0.45)] z-10"
      />
    </div>
  );
}
