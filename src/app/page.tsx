'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, role, loading, isFirebaseReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If we're not loading and user state is known
    if (!loading) {
      if (user && role) {
        router.push(`/${role}`);
      } else {
        router.push('/login');
      }
    }
  }, [loading, user, role, router]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-solid)', flexDirection: 'column', gap: '16px' }}>
      <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px' }}>INITIALIZING TEROS...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
