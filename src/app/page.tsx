'use client';

import Header from '@/components/layout/Header';
import LeftPanel from '@/components/panels/LeftPanel';
import NavPanel from '@/components/panels/NavPanel';
import DynamicMap from '@/components/map/DynamicMap';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import OfflineBanner from '@/components/ui/OfflineBanner';
import Notification from '@/components/ui/Notification';
import EmergencyModal from '@/components/ui/EmergencyModal';
import RouteSwitchModal from '@/components/ui/RouteSwitchModal';
import MissionTelemetryOverlay from '@/components/ui/MissionTelemetryOverlay';
import RoleSelector from '@/components/ui/RoleSelector';
import PatientRolePanel from '@/components/panels/PatientRolePanel';
import DriverRolePanel from '@/components/panels/DriverRolePanel';
import HospitalRolePanel from '@/components/panels/HospitalRolePanel';
import AdminRolePanel from '@/components/panels/AdminRolePanel';
import { useApp } from '@/lib/AppContext';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { activeRole, isSidebarOpen } = useApp();
  const { user, role, loading, isFirebaseReady } = useAuth();
  const router = useRouter();

  // If Firebase is configured and user not logged in — redirect to login
  useEffect(() => {
    if (!loading && isFirebaseReady && !user) {
      router.push('/login');
    }
  }, [loading, isFirebaseReady, user, router]);

  // Show loading spinner while auth resolves
  if (loading && isFirebaseReady) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-solid)', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px' }}>AUTHENTICATING...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <LoadingOverlay />
      <Notification />
      <EmergencyModal />
      <RouteSwitchModal />
      <Header />
      <OfflineBanner />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
        {/* Left Sidebar Content */}
        <div className="left-panel" style={{
          width: isSidebarOpen ? '400px' : '0px',
          height: '100%', background: 'var(--surface)',
          borderRight: isSidebarOpen ? '1px solid var(--border)' : 'none',
          zIndex: 30,
          overflowY: 'auto', position: 'relative',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? 'auto' : 'none',
        }}>
          <div key={activeRole} style={{ animation: 'slideIn 0.4s ease-out' }}>
            {activeRole === 'simulation' ? <LeftPanel /> : (
              <>
                {activeRole === 'patient' && <PatientRolePanel />}
                {activeRole === 'driver' && <DriverRolePanel />}
                {activeRole === 'hospital' && <HospitalRolePanel />}
                {activeRole === 'admin' && <AdminRolePanel />}
              </>
            )}
          </div>
        </div>

        {/* Map View */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <DynamicMap />
          </div>

          <MissionTelemetryOverlay />

          {activeRole !== 'simulation' && (
            <div style={{ position: 'absolute', top: '16px', left: 0, right: 0, zIndex: 1000, pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto' }}>
                <RoleSelector />
              </div>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 20 }}>
            <div style={{ pointerEvents: 'auto' }}>
              <NavPanel />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
