'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Mail, Lock, AlertCircle, Loader2, ChevronRight, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DEMO_CREDENTIALS = [
  { role: 'Admin', email: 'admin@teros.com', password: 'admin123', color: '#E11D48', icon: '🛡️', path: '/admin' },
  { role: 'Hospital', email: 'hospital@aiims.com', password: 'hospital123', color: '#2563EB', icon: '🏥', path: '/hospital' },
  { role: 'Patient', email: 'patient@teros.com', password: 'patient123', color: '#059669', icon: '🆘', path: '/patient' },
  { role: 'Driver', email: 'driver@teros.com', password: 'driver123', color: '#D97706', icon: '🚑', path: '/driver' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const { isFirebaseReady } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (!isFirebaseReady) {
      // Demo mode: match email to path
      const match = DEMO_CREDENTIALS.find(c => c.email === email && c.password === password);
      if (match) {
        setTimeout(() => router.push(match.path), 400);
      } else {
        setError('Invalid credentials. Please use the demo accounts below.');
        setIsLoading(false);
      }
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext handles redirect
    } catch (err: any) {
      const code = err.code || '';
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        setError('Invalid email or password. Please verify credentials.');
      } else if (code.includes('network')) {
        setError('Network error — please check your connection.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (cred: typeof DEMO_CREDENTIALS[0]) => {
    setDemoLoading(cred.role);
    setError('');
    if (!isFirebaseReady) {
      setTimeout(() => {
        setDemoLoading(null);
        router.push(cred.path);
      }, 600);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, cred.email, cred.password);
    } catch {
      // If demo user doesn't exist in Firebase, navigate directly
      setDemoLoading(null);
      router.push(cred.path);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-solid)',
      position: 'relative',
      overflow: 'auto',
      padding: '24px',
    }}>
      {/* Animated background blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float1 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float2 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.3
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '480px', position: 'relative', zIndex: 10 }}>
        {/* Header badge */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '9999px',
            background: 'var(--primary-light)', border: '1px solid var(--primary)',
            fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1.5px'
          }}>
            <Radio size={10} style={{ animation: 'pulseGlow 2s infinite' }} />
            LIVE MISSION PLATFORM
          </div>
        </div>

        {/* Main login card */}
        <div style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          borderRadius: '28px',
          padding: '36px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
          animation: 'fadeInUp 0.6s cubic-bezier(0.4,0,0.2,1)'
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '72px', height: '72px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
              borderRadius: '22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(37,99,235,0.4)',
              animation: 'float1 4s ease-in-out infinite'
            }}>
              <Shield size={36} color="white" />
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-2px', margin: 0 }}>TEROS</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px', letterSpacing: '0.5px' }}>
              Emergency Intelligence Nexus
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="email"
                placeholder="Agency Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '15px 16px 15px 44px',
                  borderRadius: '14px', border: '1.5px solid var(--border)',
                  background: 'var(--surface-alt)', color: 'var(--text)',
                  fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="password"
                placeholder="Security Protocol"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '15px 16px 15px 44px',
                  borderRadius: '14px', border: '1.5px solid var(--border)',
                  background: 'var(--surface-alt)', color: 'var(--text)',
                  fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '12px',
                background: 'var(--critical-light)', border: '1px solid var(--critical)',
                color: 'var(--critical)', fontSize: '13px', fontWeight: 600
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              style={{
                marginTop: '4px', padding: '16px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
                color: 'white', border: 'none',
                fontSize: '15px', fontWeight: 800,
                letterSpacing: '0.5px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                opacity: isLoading ? 0.8 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isLoading
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> AUTHENTICATING...</>
                : <><Shield size={18} /> AUTHENTICATE</>
              }
            </button>
          </form>
        </div>

        {/* Demo access cards */}
        <div style={{ background: 'var(--surface)', backdropFilter: 'blur(24px)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', animation: 'fadeInUp 0.7s 0.1s cubic-bezier(0.4,0,0.2,1) both' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '16px', textAlign: 'center' }}>
            DEMO ACCESS — QUICK LOGIN
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {DEMO_CREDENTIALS.map(cred => (
              <button
                key={cred.role}
                id={`demo-login-${cred.role.toLowerCase()}`}
                onClick={() => handleDemoLogin(cred)}
                disabled={!!demoLoading}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: `${cred.color}14`,
                  border: `1.5px solid ${cred.color}40`,
                  color: cred.color,
                  cursor: demoLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  opacity: demoLoading && demoLoading !== cred.role ? 0.5 : 1
                }}
                onMouseEnter={e => { if (!demoLoading) { (e.currentTarget as HTMLElement).style.background = `${cred.color}22`; (e.currentTarget as HTMLElement).style.borderColor = cred.color; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${cred.color}14`; (e.currentTarget as HTMLElement).style.borderColor = `${cred.color}40`; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{cred.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900 }}>{cred.role}</div>
                    <div style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{cred.email}</div>
                  </div>
                </div>
                {demoLoading === cred.role
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <ChevronRight size={14} />
                }
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          {process.env.NEXT_PUBLIC_COPYRIGHT_NOTICE} · v0.8.2
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: var(--text-muted); }
        input { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
