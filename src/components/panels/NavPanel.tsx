'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { routes, hospitals } from '@/lib/mockData';

export default function NavPanel() {
  const { 
    navigating, paused, setPaused, setNavigating, 
    selectedHospital, currentRouteIdx, ambulanceProgress,
    setAmbulanceProgress, setRouteSwitchModalOpen, showNotification,
  } = useApp();

  if (!navigating) return null;

  const hospitalRoutes = routes[selectedHospital] || routes['aiims_rishikesh'];
  const currentRoute = hospitalRoutes[currentRouteIdx];
  const destName = hospitals.find(h => h.id === selectedHospital)?.name;

  const totalMin = parseInt(currentRoute?.time || '20');
  const remMinScale = Math.max(0, totalMin * (1 - ambulanceProgress));
  const remMin = Math.floor(remMinScale);
  const remSec = Math.floor((remMinScale - remMin) * 60);
  const timeDisplay = `${remMin.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;

  // Get current altitude from elevation data
  const elevation = currentRoute?.elevation || [];
  const eIdx = Math.min(
    Math.floor(ambulanceProgress * (elevation.length - 1)), 
    elevation.length - 1
  );
  const currentAlt = elevation[eIdx] || 372;

  const handleSwitchRoute = () => {
    if (hospitalRoutes.length < 2) {
      showNotification('No Alternative', 'No alternative routes available.', 'warning');
      return;
    }
    setRouteSwitchModalOpen(true);
  };

  const handleEnd = () => {
    setNavigating(false);
    setPaused(false);
    setAmbulanceProgress(0);
  };

  return (
    <div style={{
      position: 'absolute', bottom: '16px', left: '16px', right: '16px',
      zIndex: 1000, background: 'var(--surface-solid)', borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)', padding: '16px 20px',
      border: '1px solid var(--border)',
      backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '28px', fontWeight: 700, color: 'var(--primary)' }}>
            {timeDisplay}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            → {destName}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Distance</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{currentRoute?.distance}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Altitude</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{currentAlt} m</div>
          </div>
          <div className="desktop-only">
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Steepness</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{currentRoute?.steepness}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSwitchRoute}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: 'var(--primary)', color: '#fff',
          }}
        >
          ⚠ Switch Route
        </button>
        <button 
          onClick={() => setPaused(!paused)}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text-secondary)',
          }}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button 
          onClick={handleEnd}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: 'var(--danger)', color: '#fff',
          }}
        >
          ✕ End
        </button>
      </div>
    </div>
  );
}
