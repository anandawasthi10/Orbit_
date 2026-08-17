import Link from 'next/link';
import { Users, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import HeroLogo3D from '@/components/HeroLogo3D';

export default function HomePage() {
  return (
    <div className="py-4 sm:py-6 space-y-12 relative">
      {/* Background Dot Grid & Soft Gradient Depth Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 rounded-3xl">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.14] [mask-image:radial-gradient(ellipse_at_center,white_35%,transparent_80%)]"
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 28 28"
        >
          <circle cx="2" cy="2" r="1.2" fill="#2563EB" />
        </svg>

        {/* Soft Blurred Gradient Blobs */}
        <div className="absolute -top-12 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[90px]" />
        <div className="absolute top-1/4 -right-16 w-96 h-96 bg-purple-500/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-3 relative z-10 pt-2">
        {/* Logo with Orbital Glow */}
        <div className="flex justify-center my-3">
          <div className="relative group">
            {/* Ambient Soft Blue Radial Glow */}
            <div className="absolute inset-0 bg-blue-600/30 rounded-full blur-3xl group-hover:bg-blue-600/45 transition duration-500"></div>

            {/* Stable Hero Logo with Subtle Orbital Detail */}
            <div className="relative">
              <HeroLogo3D />
            </div>
          </div>
        </div>

        {/* Headline with Strong Visual Hierarchy & Dual Gradients */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] pt-1">
          The{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
            Command Center
          </span>{' '}
          for Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Team&apos;s Sprint
          </span>
        </h1>

        {/* Subtext Paragraph */}
        <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto pt-1">
          Streamline user onboarding, showcase skills, manage member profiles, and foster high-performance teamwork with Orbit.
        </p>

        {/* CTAs Tightly Grouped */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
          <Link
            href="/signup"
            className="saas-btn-primary px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Join Orbit Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm hover:-translate-y-0.5 transition-all"
          >
            Log In to Account
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="saas-card rounded-2xl p-7 space-y-3 relative bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Instant Signup &amp; Auth</h3>
          <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
            Secure password hashing via bcrypt, NextAuth JWT sessions, and seamless single-click account creation.
          </p>
        </div>

        <div className="saas-card rounded-2xl p-7 space-y-3 relative bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Automated Onboarding</h3>
          <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
            Smart middleware protection ensures new members complete their role, bio, and skills before workspace access.
          </p>
        </div>

        <div className="saas-card rounded-2xl p-7 space-y-3 relative bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Live Team Directory</h3>
          <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
            Explore member skills, avatars, positions, and bio descriptions powered directly by MongoDB.
          </p>
        </div>
      </div>
    </div>
  );
}
