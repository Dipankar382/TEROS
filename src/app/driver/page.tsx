'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldOff } from 'lucide-react';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/map/DynamicMap'), { ssr: false });
import DriverRolePanel from '@/components/panels/DriverRolePanel';
import Header from '@/components/layout/Header';
import NavPanel from '@/components/panels/NavPanel';
import Notification from '@/components/ui/Notification';
import EmergencyModal from '@/components/ui/EmergencyModal';
import RouteSwitchModal from '@/components/ui/RouteSwitchModal';
import MissionTelemetryOverlay from '@/components/ui/MissionTelemetryOverlay';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import OfflineBanner from '@/components/ui/OfflineBanner';

export default function DriverPage() {
  const { setActiveRole, isSidebarOpen } = useApp();
  const { user, role, loading, isFirebaseReady } = useAuth();
  const router = useRouter();

  useEffect(() => { setActiveRole('driver'); }, [setActiveRole]);

  useEffect(() => {
    if (!loading && isFirebaseReady) {
      if (!user) { router.push('/login'); return; }
      if (role && role !== 'driver' && role !== 'admin') router.push(`/${role}`);
    }
  }, [loading, user, role, isFirebaseReady, router]);

  if (loading && isFirebaseReady) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-solid)', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--warning)' }} />
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px' }}>LOADING DRIVER INTERFACE...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isFirebaseReady && role && role !== 'driver' && role !== 'admin') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-solid)', flexDirection: 'column', gap: '16px' }}>
        <ShieldOff size={48} color="var(--critical)" />
        <div style={{ fontSize: '20px', fontWeight: 900 }}>ACCESS DENIED</div>
        <button onClick={() => router.push('/login')} style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '14px', background: 'var(--primary)', color: 'white', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <LoadingOverlay />
      <Notification />
      <EmergencyModal />
      <RouteSwitchModal />
      <Header />
      <OfflineBanner />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div className="left-panel" style={{
          width: isSidebarOpen ? '400px' : '0px', height: '100%',
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          overflowY: 'auto', transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isSidebarOpen ? 1 : 0, zIndex: 30
        }}>
          <DriverRolePanel />
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0 }}><DynamicMap /></div>
          <MissionTelemetryOverlay />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 }}><NavPanel /></div>
        </div>
      </div>
    </main>
  );
}
