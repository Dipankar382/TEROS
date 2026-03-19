'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { Shield, Activity, Users, Map as MapIcon, Wifi, AlertTriangle, Zap, Timer } from 'lucide-react';

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
    ambulanceSpeed, goldenHour,
    liveTemp, liveWind, liveVisibility, liveRain,
    elevationData, currentSegIdx,
    showNotification, t, language,
    setNavigating, setMissionStage, startCriticalEvent, findOptimalHospital
  } = useApp();

  const activeAmbulance = ambulances.find(a => a.id === activeAmbulanceId);

  // Terrain risk calculations
  const liveAltitude = Math.round(elevationData[currentSegIdx] || 0);
  const rainRisk = liveRain === 'Heavy' ? 90 : liveRain === 'Moderate' ? 55 : liveRain === 'Light' ? 25 : 10;
  const landslideRisk = Math.round(rainRisk * 0.7 + (liveAltitude / 2000) * 30);
  const fogRisk = Math.max(0, 100 - liveVisibility * 20);

  const maxElev = Math.max(...elevationData, 1);
  const minElev = Math.min(...elevationData);
  const elevRange = maxElev - minElev || 1;

  const isCriticalTime = goldenHour < 600;

  const formatGH = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const resetSystem = () => {
    setSosStatus('idle');
    setActiveAmbulanceId(null);
    setEmergencyCoords(null);
    setAmbulances(prev => prev.map(a => ({ ...a, status: 'available' as const })));
    setNavigating(false);
    setMissionStage('idle');
    showNotification('System Reset', 'Global state has been cleared by Admin.', 'warning');
  };

  const handleRespond = () => {
    if (!emergencyCoords) return;
    
    // Allocate the best LIVE ambulance
    let targetAmbulanceId = activeAmbulanceId;
    if (!targetAmbulanceId) {
      if (ambulances.length === 0) {
        showNotification('No Driver Connected', 'Please connect a driver device to respond.', 'warning');
        return;
      }
      // Pick the first available live driver
      targetAmbulanceId = ambulances[0].id;
      setActiveAmbulanceId(targetAmbulanceId);
    }

    setNavigating(true);
    setMissionStage('to_patient');
    setSosStatus('dispatched');
    startCriticalEvent('high');
    
    showNotification('Mission Started', `Directly connected to Unit ${targetAmbulanceId}. Routing initiated...`, 'success');
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
        <>
          <section style={{ padding: '20px', background: 'var(--critical-light)', borderRadius: '20px', border: '1px solid var(--critical)' }}>
             <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--critical)', marginBottom: '12px' }}>{t('active_mission_data').toUpperCase()}</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>{activeAmbulance?.name || 'ALLOCATING'}</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--critical)' }}>{sosStatus.toUpperCase()}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '10px', background: 'var(--surface)', borderRadius: '10px' }}>
                     <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>VITAL: HR</div>
                     <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--critical)' }}>{heartRate} <span style={{ fontSize: '9px' }}>BPM</span></div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--surface)', borderRadius: '10px' }}>
                     <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>VITAL: O2</div>
                     <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary)' }}>{spo2}%</div>
                  </div>
                </div>
             </div>

              {sosStatus === 'requested' && (
                <button 
                  onClick={handleRespond}
                  disabled={ambulances.length === 0}
                  style={{
                    width: '100%', marginTop: '16px', padding: '14px', borderRadius: '12px',
                    background: ambulances.length > 0 ? 'white' : 'var(--surface-alt)', 
                    color: ambulances.length > 0 ? 'var(--critical)' : 'var(--text-muted)',
                    border: 'none',
                    fontSize: '13px', fontWeight: 900, cursor: ambulances.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: ambulances.length > 0 ? '0 4px 12px rgba(220, 53, 69, 0.4)' : 'none',
                    animation: ambulances.length > 0 ? 'pulseGlow 2s infinite' : 'none',
                    opacity: ambulances.length > 0 ? 1 : 0.6
                  }}
                >
                  <Zap size={16} fill="currentColor" /> 
                  {ambulances.length > 0 ? 'RESPOND TO EMERGENCY' : 'WAIT FOR LIVE DRIVER...'}
                </button>
              )}
          </section>

          {/* Speed + Golden Hour HUD */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{
              background: 'var(--primary-light)', border: '1px solid var(--primary)',
              borderRadius: '16px', padding: '14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>VELOCITY</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)' }}>
                {ambulanceSpeed}<span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>km/h</span>
              </div>
            </div>
            <div style={{
              background: isCriticalTime ? 'var(--critical-light)' : 'var(--warning-light)',
              border: `1px solid ${isCriticalTime ? 'var(--critical)' : 'var(--warning)'}`,
              borderRadius: '16px', padding: '14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: isCriticalTime ? 'var(--critical)' : 'var(--warning)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                GOLDEN HOUR
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: isCriticalTime ? 'var(--critical)' : 'var(--warning)', fontFamily: "'Space Mono', monospace" }}>
                {formatGH(goldenHour)}
              </div>
            </div>
          </div>

          {/* Terrain Risk */}
          <div style={{
            background: 'var(--surface-alt)', borderRadius: '16px', padding: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              TERRAIN RISK
            </div>
            {[
              { label: 'Landslide', pct: landslideRisk, color: landslideRisk > 60 ? 'var(--critical)' : landslideRisk > 40 ? 'var(--warning)' : 'var(--success)' },
              { label: 'Fog Density', pct: Math.round(fogRisk), color: fogRisk > 70 ? 'var(--critical)' : fogRisk > 40 ? 'var(--warning)' : 'var(--success)' },
            ].map((risk, i) => (
              <div key={i} style={{ marginBottom: i === 0 ? '10px' : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{risk.label}</span>
                  <span style={{ fontWeight: 800, color: risk.color }}>{risk.pct}%</span>
                </div>
                <div style={{ height: '5px', background: 'var(--surface)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${risk.pct}%`, background: risk.color, borderRadius: '3px', transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Elevation Profile */}
          <div style={{
            background: 'var(--surface-alt)', borderRadius: '16px', padding: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ELEVATION
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>{liveAltitude}m</div>
            </div>
            <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
              {elevationData.map((e: number, i: number) => {
                const pct = ((e - minElev) / elevRange) * 100;
                const height = 6 + pct * 0.34;
                const isCurrent = i === currentSegIdx;
                return (
                  <div key={i} style={{
                    flex: 1, borderRadius: '2px 2px 0 0', minHeight: '3px', height: `${height}px`,
                    background: isCurrent ? 'var(--primary)' : `hsl(${pct > 70 ? 0 : pct > 40 ? 35 : 200}, 70%, 55%)`,
                    opacity: isCurrent ? 1 : 0.5,
                    boxShadow: isCurrent ? '0 0 6px var(--primary)' : 'none',
                    transition: 'all 0.3s'
                  }} />
                );
              })}
            </div>
          </div>

          {/* Live Conditions */}
          <div style={{
            background: 'var(--surface-alt)', borderRadius: '16px', padding: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              LIVE CONDITIONS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: '🌡️ Temp', val: `${liveTemp}°C` },
                { label: '👁️ Vis', val: `${liveVisibility?.toFixed(1) || '0.0'} km` },
                { label: '💨 Wind', val: `${liveWind} km/h` },
                { label: '🌧️ Rain', val: liveRain },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: '24px', opacity: 0.6 }}>
           <div style={{ fontSize: '32px' }}>🛡️</div>
           <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '8px' }}>SYSTEM NOMINAL</div>
        </div>
      )}

      {/* Management Fleet */}
      <section style={{ flex: 1 }}>
        <h3 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '12px', color: 'var(--text)' }}>AMBULANCE FLEET</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ambulances.map(a => (
            <div key={a.id} className="glass-card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.status === 'available' ? 'var(--success)' : 'var(--critical)', boxShadow: a.status === 'available' ? '0 0 6px var(--success)' : '0 0 6px var(--critical)' }}></div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{a.name}</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)' }}>{a.lat?.toFixed(4) || '0.0000'}, {a.lng?.toFixed(4) || '0.0000'}</span>
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
