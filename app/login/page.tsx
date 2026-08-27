'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [domainError, setDomainError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDomainError(false);
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (res?.error) throw new Error(res.error || 'Invalid email or password');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setDomainError(false);
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!user || !user.email) throw new Error('Could not retrieve user details from Google');

      // Bridge Firebase Google User directly into NextAuth Session
      const authRes = await signIn('credentials', {
        email: user.email,
        isGoogleAuth: 'true',
        name: user.displayName || user.email.split('@')[0],
        avatarUrl: user.photoURL || '',
        password: 'google-authenticated',
        redirect: false,
      });

      if (authRes?.error) {
        throw new Error(authRes.error || 'Failed to authenticate session with Google');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setDomainError(true);
        setError('Google Sign-In needs the domain added under Firebase Console → Authentication → Authorized domains.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else {
        setError(err.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      {/* Card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: '16px',
          padding: '40px 36px 36px',
          boxShadow: '0 8px 40px rgba(99,102,241,0.12), 0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: '#000',
              marginBottom: '16px',
            }}
          >
            {/* Simple O letter as brand mark */}
            <span
              style={{
                fontFamily: "'Rubik Doodle Shadow', system-ui, sans-serif",
                fontSize: '22px',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              O
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: '22px',
              color: '#0a0a0a',
              margin: '0 0 6px',
              letterSpacing: '-0.3px',
            }}
          >
            Sign in to Orbit
          </h1>
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '13px',
              color: '#777',
              margin: 0,
            }}
          >
            Access your team workspace &amp; sprint dashboard
          </p>
        </div>

        {/* Google button */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: '8px',
            border: '1.5px solid #e0e0e0',
            background: '#fff',
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: '13.5px',
            color: '#111',
            transition: 'border-color .15s, box-shadow .15s',
            opacity: googleLoading ? 0.6 : 1,
          }}
          onMouseOver={e => (e.currentTarget.style.borderColor = '#aaa')}
          onMouseOut={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
        >
          {googleLoading ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>{googleLoading ? 'Authenticating…' : 'Continue with Google'}</span>
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '20px 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: '#ebebeb' }} />
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#aaa',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            or continue with email
          </span>
          <div style={{ flex: 1, height: '1px', background: '#ebebeb' }} />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#fff8f8',
              border: '1px solid #fcd0d0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={15} style={{ color: '#e53e3e', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: '#c53030', lineHeight: 1.45 }}>
                {error}
              </span>
            </div>
            {domainError && (
              <a
                href="https://console.firebase.google.com/u/0/project/orbit-82b1a/authentication/providers"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#c53030',
                  textDecoration: 'underline',
                }}
              >
                Open Firebase Console <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@example.com"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingLeft: '36px',
                  paddingRight: '14px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid #e0e0e0',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '13.5px',
                  color: '#111',
                  outline: 'none',
                  background: '#fafafa',
                  transition: 'border-color .15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.background = '#fff'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.background = '#fafafa'; }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingLeft: '36px',
                  paddingRight: '14px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid #e0e0e0',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '13.5px',
                  color: '#111',
                  outline: 'none',
                  background: '#fafafa',
                  transition: 'border-color .15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.background = '#fff'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.background = '#fafafa'; }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#555' : '#0a0a0a',
              color: '#fff',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background .15s, transform .1s',
            }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#222'; }}
            onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#0a0a0a'; }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                Signing in…
              </span>
            ) : (
              <>
                <span style={{ flex: 1, textAlign: 'center', paddingLeft: '20px' }}>
                  Sign in to Workspace
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #ebebeb',
            textAlign: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '12.5px',
            color: '#888',
          }}
        >
          Don&apos;t have a member account?{' '}
          <Link
            href="/signup"
            style={{ color: '#0a0a0a', fontWeight: 700, textDecoration: 'none' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
