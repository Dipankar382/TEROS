'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { routes } from '@/lib/mockData';

export default function RouteSwitchModal() {
  const { 
    routeSwitchModalOpen, setRouteSwitchModalOpen,
    selectedHospital, currentRouteIdx, setCurrentRouteIdx,
    showNotification, navigating, ambulanceProgress, setAmbulanceProgress,
    paused, setPaused,
  } = useApp();

  if (!routeSwitchModalOpen) return null;

  const hospitalRoutes = routes[selectedHospital] || routes['aiims_rishikesh'];
  const current = hospitalRoutes[currentRouteIdx];
  const nextIdx = (currentRouteIdx + 1) % hospitalRoutes.length;
  const next = hospitalRoutes[nextIdx];

  if (!current || !next) return null;

  const timeDiff = parseInt(next.time) - parseInt(current.time);

  const handleSwitch = () => {
    setCurrentRouteIdx(nextIdx);
    setRouteSwitchModalOpen(false);
    showNotification('Route Switched', 'Navigation updated to safer route.', 'success');
    if (navigating) {
      setAmbulanceProgress((prev: number) => Math.max(0, prev - 0.05));
      if (paused) { setPaused(false); }
    }
  };

  return (
    <div style={{
      display: 'flex', position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)', zIndex: 5000,
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--surface-solid)', borderRadius: 'var(--radius-lg)',
        padding: '28px', maxWidth: '440px', width: '90%', boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
          ⚠ Route Condition Alert
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Weather risk detected on {current.name}. Safer route available via {next.name} ({timeDiff > 0 ? '+' : ''}{timeDiff} min).
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, background: 'var(--critical-light)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--critical)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current</div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: 'var(--text)' }}>{current.name}</div>
          </div>
          <div style={{ flex: 1, background: 'var(--success-light)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggested</div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: 'var(--text)' }}>{next.name}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setRouteSwitchModalOpen(false)}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', background: 'var(--surface-alt)', color: 'var(--text-secondary)',
            }}
          >
            Keep Current
          </button>
          <button
            onClick={handleSwitch}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', background: 'var(--primary)', color: '#fff',
            }}
          >
            Switch Route
          </button>
        </div>
      </div>
    </div>
  );
}
