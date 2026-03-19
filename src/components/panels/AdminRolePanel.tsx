'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { Shield, Activity, Users, Map as MapIcon, Wifi, AlertTriangle } from 'lucide-react';

export default function AdminRolePanel() {
  const {
    activeRole, setActiveRole,
    sosStatus, setSosStatus,
    ambulances, setAmbulances,
    activeAmbulanceId, setActiveAmbulanceId,
    emergencyCoords, setEmergencyCoords,
    hospitalData, heartRate, spo2,
    terrain, setTerrain,
    weatherLayer, setWeatherLayer,
    trafficLayer, setTrafficLayer,
    showNotification, t, language
  } = useApp();

  const activeAmbulance = ambulances.find(a => a.id === activeAmbulanceId);
  
  const resetSystem = () => {
    setSosStatus('idle');
    setActiveAmbulanceId(null);
    setEmergencyCoords(null);
    setAmbulances(prev => prev.map(a => ({ ...a, status: 'available' as const })));
    showNotification('System Reset', 'Global state has been cleared by Admin.', 'warning');
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--critical)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
           {t('supervisor_nexus')}
        </div>
        <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: 'var(--text)' }}>{t('admin_panel')}</h2>
      </header>

      {/* Global Environmental Controls */}
      <section className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
          <MapIcon size={16} /> {t('global_command').toUpperCase()}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { id: 'terrain', label: 'Terrain Risk', active: terrain, setter: setTerrain, icon: AlertTriangle },
            { id: 'weather', label: 'Weather Sys', active: weatherLayer, setter: setWeatherLayer, icon: Wifi },
            { id: 'traffic', label: 'Traffic Flow', active: trafficLayer, setter: setTrafficLayer, icon: Activity }
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => layer.setter(!layer.active)}
              style={{
                padding: '12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
                background: layer.active ? 'var(--primary)' : 'var(--surface-alt)',
                color: layer.active ? 'white' : 'var(--text)',
                border: '1px solid var(--border)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
              }}
            >
              <layer.icon size={14} />
              {layer.label.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Active Mission Insights */}
      {sosStatus !== 'idle' ? (
        <section style={{ padding: '20px', background: 'var(--critical-light)', borderRadius: '24px', border: '1px solid var(--critical)' }}>
           <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--critical)', marginBottom: '12px' }}>{t('active_mission_data').toUpperCase()}</div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 800 }}>{activeAmbulance?.name || 'ALLOCATING'}</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--critical)' }}>{sosStatus.toUpperCase()}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="glass-card" style={{ padding: '10px', background: 'white' }}>
                   <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>VITAL: HR</div>
                   <div style={{ fontSize: '16px', fontWeight: 900 }}>{heartRate} <span style={{ fontSize: '9px' }}>BPM</span></div>
                </div>
                <div className="glass-card" style={{ padding: '10px', background: 'white' }}>
                   <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>VITAL: O2</div>
                   <div style={{ fontSize: '16px', fontWeight: 900 }}>{spo2}%</div>
                </div>
              </div>
           </div>
        </section>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: '24px', opacity: 0.6 }}>
           <div style={{ fontSize: '32px' }}>🛡️</div>
           <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '8px' }}>SYSTEM NOMINAL</div>
        </div>
      )}

      {/* Management Fleet */}
      <section style={{ flex: 1 }}>
        <h3 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '12px' }}>AMBULANCE FLEET</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ambulances.map(a => (
            <div key={a.id} className="glass-card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.status === 'available' ? 'var(--success)' : 'var(--critical)' }}></div>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{a.name}</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, opacity: 0.6 }}>{a.lat.toFixed(4)}, {a.lng.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Admin Actions */}
      <button 
        onClick={resetSystem}
        style={{
          padding: '16px', borderRadius: '16px', background: 'var(--text)', color: 'var(--surface-solid)',
          fontSize: '12px', fontWeight: 900, cursor: 'pointer', border: 'none',
          marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}
      >
        <Shield size={16} /> {t('system_reset').toUpperCase()}
      </button>
    </div>
  );
}
