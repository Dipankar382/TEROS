'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { Navigation, MapPin, CheckCircle2, ShieldAlert, Activity, AlertCircle, Timer, Zap } from 'lucide-react';
import { hospitals } from '@/lib/mockData';

export default function DriverRolePanel() {
  const {
    sosStatus, setSosStatus,
    activeAmbulanceId, setActiveAmbulanceId,
    driverCoords, setDriverCoords,
    emergencyCoords, selectedHospital,
    calculateDistance, showNotification,
    isLiveGPS, setIsLiveGPS,
    ambulances, setAmbulances,
    ambulanceSpeed, goldenHour,
    liveTemp, liveWind, liveVisibility, liveRain,
    elevationData, currentSegIdx,
    t, language, emitSync, userId
  } = useApp();

  const activeAmbulance = (Array.isArray(ambulances) ? ambulances.find(a => a.id === activeAmbulanceId) : null) || (Array.isArray(ambulances) ? ambulances[0] : null);
  const targetHospital = hospitals.find(h => h.id === selectedHospital);

  const distToPatient = (driverCoords && emergencyCoords) ? calculateDistance(driverCoords, emergencyCoords) : Infinity;
  const distToHospital = (driverCoords && targetHospital) ? calculateDistance(driverCoords, [targetHospital.lat, targetHospital.lng]) : Infinity;

  const canPickUp = distToPatient <= 10;
  const canHandover = distToHospital <= 10;

  // Terrain risk calculations
  const liveAltitude = Math.round(elevationData[currentSegIdx] || 0);
  const rainRisk = liveRain === 'Heavy' ? 90 : liveRain === 'Moderate' ? 55 : liveRain === 'Light' ? 25 : 10;
  const landslideRisk = Math.round(rainRisk * 0.7 + (liveAltitude / 2000) * 30);
  const fogRisk = Math.max(0, 100 - liveVisibility * 20);

  const maxElev = Math.max(...elevationData, 1);
  const minElev = Math.min(...elevationData);
  const elevRange = maxElev - minElev || 1;

  const formatGH = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCriticalTime = goldenHour < 600;

  const handlePickUp = () => {
    emitSync('STATE_TRANSITION', { trip_id: activeAmbulanceId, new_state: 'ARRIVED_AT_PATIENT' });
    setSosStatus('picked_up');
    showNotification('Patient Picked Up', 'Heading to optimal hospital destination.', 'success');
  };

  const handleHandover = () => {
    emitSync('STATE_TRANSITION', { trip_id: activeAmbulanceId, new_state: 'COMPLETED' });
    setSosStatus('delivered');
    showNotification('Handover Complete', 'Mission successfully ended.', 'success');
    setTimeout(() => {
        setSosStatus('idle');
        setActiveAmbulanceId(null);
    }, 3000);
  };

  // Assign this device to its unique userId for demo and enable live GPS by default
  React.useEffect(() => {
    if (userId) {
      setActiveAmbulanceId(userId);
      setIsLiveGPS(true);
    }
  }, [userId, setActiveAmbulanceId, setIsLiveGPS]);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header>
        <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
          {t('live_mission_telemetry')}
        </div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{t('driver_panel')}</h2>
      </header>

      {sosStatus === 'idle' ? (
        <section style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface-alt)', borderRadius: '24px', border: '1px dashed var(--border-strong)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800 }}>{t('status_idle')}</h3>
          <p style={{ color: 'var(--text)', fontSize: '14px', margin: 0, fontWeight: 500 }}>
            {t('sos_description')}
          </p>
        </section>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mission Alert */}
          <div style={{ 
            padding: '20px', background: 'var(--critical)', borderRadius: '20px',
            color: 'white', display: 'flex', alignItems: 'center', gap: '16px',
            animation: sosStatus === 'requested' ? 'pulseScale 1s infinite alternate' : 'none'
          }}>
            <ShieldAlert size={32} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>
                {sosStatus === 'requested' ? "Incoming SOS Request" : 
                 sosStatus === 'dispatched' ? "Mission Dispatched" : 
                 sosStatus === 'picked_up' ? "Patient Onboard" : 
                 "Mission Completed"}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900 }}>
                {sosStatus === 'requested' ? "EMERGENCY: RESPONSE NEEDED" : 
                 sosStatus === 'dispatched' ? "En Route to Scene" : 
                 "Priority Hospital Route"}
              </div>
            </div>
          </div>

          {sosStatus === 'requested' && (
            <button 
              onClick={() => {
                if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate([200, 100, 200]);
                }
                setIsLiveGPS(true);
                emitSync('ACCEPT_SOS', { trip_id: activeAmbulanceId });
              }}
              style={{
                width: '100%', padding: '20px', background: '#10B981', color: 'white',
                borderRadius: '16px', border: 'none', fontWeight: 900, cursor: 'pointer',
                fontSize: '16px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}
            >
              🚀 {t('respond_to_emergency')}
            </button>
          )}

          {/* ── Speed + Golden Hour HUD ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
          }}>
            <div style={{
              background: 'var(--primary-light)', border: '1px solid var(--primary)',
              borderRadius: '16px', padding: '16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                VELOCITY
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary)', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px' }}>
                {ambulanceSpeed}<span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>km/h</span>
              </div>
              <div style={{ marginTop: '8px', height: '4px', background: 'rgba(27,115,232,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((ambulanceSpeed / 160) * 100, 100)}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            <div style={{
              background: isCriticalTime ? 'var(--critical-light)' : 'var(--warning-light)',
              border: `1px solid ${isCriticalTime ? 'var(--critical)' : 'var(--warning)'}`,
              borderRadius: '16px', padding: '16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: isCriticalTime ? 'var(--critical)' : 'var(--warning)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                GOLDEN HOUR
              </div>
              <div style={{
                fontSize: '28px', fontWeight: 900,
                color: isCriticalTime ? 'var(--critical)' : 'var(--warning)',
                fontFamily: "'Space Mono', monospace"
              }}>
                {formatGH(goldenHour)}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {isCriticalTime ? '⚠️ CRITICAL WINDOW' : '⏱ COUNTING DOWN'}
              </div>
            </div>
          </div>

          {/* ── Terrain Risk ── */}
          <div style={{
            background: 'var(--surface-alt)', borderRadius: '16px', padding: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              TERRAIN RISK ANALYSIS
            </div>
            {[
              { label: 'Landslide Risk', pct: landslideRisk, color: landslideRisk > 60 ? 'var(--critical)' : landslideRisk > 40 ? 'var(--warning)' : 'var(--success)' },
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

          {/* ── Elevation Profile ── */}
          <div style={{
            background: 'var(--surface-alt)', borderRadius: '16px', padding: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ELEVATION PROFILE
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>
                {liveAltitude}m AGL
              </div>
            </div>
            <div style={{ height: '50px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
              {Array.isArray(elevationData) && elevationData.map((e: number, i: number) => {
                const pct = ((e - minElev) / elevRange) * 100;
                const height = 8 + pct * 0.42;
                const isCurrent = i === currentSegIdx;
                const barColor = isCurrent ? 'var(--primary)' : `hsl(${pct > 70 ? 0 : pct > 40 ? 35 : 200}, 70%, 55%)`;
                return (
                  <div key={i} style={{
                    flex: 1, borderRadius: '2px 2px 0 0', minHeight: '4px', height: `${height}px`,
                    background: barColor, opacity: isCurrent ? 1 : 0.5,
                    boxShadow: isCurrent ? '0 0 8px var(--primary)' : 'none',
                    transition: 'all 0.3s', position: 'relative'
                  }}>
                    {isCurrent && (
                      <div style={{
                        position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                        fontSize: '7px', fontWeight: 900, color: 'var(--primary)'
                      }}>▼</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Start</span><span>Mid</span><span>Dest</span>
            </div>
          </div>

          {/* ── Live Conditions ── */}
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
                { label: '👁️ Visibility', val: `${liveVisibility?.toFixed(1) || '0.0'} km` },
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

          {/* Action Button */}
          <div style={{ background: 'var(--surface-alt)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            {sosStatus === 'requested' || sosStatus === 'dispatched' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                   {canPickUp ? '✓ Within 10m range' : `Distance: ${distToPatient?.toFixed(1) || '0.0'}m (Need < 10m)`}
                </div>
                <button 
                   disabled={!canPickUp}
                   onClick={handlePickUp}
                   style={{
                    width: '100%', padding: '18px', 
                    background: canPickUp ? 'var(--success)' : 'var(--text-muted)', 
                    color: 'white', border: 'none', borderRadius: '14px',
                    fontSize: '15px', fontWeight: 900, cursor: canPickUp ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.3s'
                   }}>
                   <CheckCircle2 size={22} /> REACHED PATIENT
                </button>
              </div>
            ) : sosStatus === 'picked_up' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                   {canHandover ? '✓ At Hospital Entry' : `To Hospital: ${distToHospital?.toFixed(1) || '0.0'}m (Need < 10m)`}
                </div>
                <button 
                   disabled={!canHandover}
                   onClick={handleHandover}
                   style={{
                    width: '100%', padding: '18px', 
                    background: canHandover ? 'var(--primary)' : 'var(--text-muted)', 
                    color: 'white', border: 'none', borderRadius: '14px',
                    fontSize: '15px', fontWeight: 900, cursor: canHandover ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.3s'
                   }}>
                   <Activity size={22} /> MISSION COMPLETE
                </button>
              </div>
            ) : null}
          </div>

          {/* Telemetry Switch */}
          <div className="glass-card" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', background: isLiveGPS ? 'var(--success)' : 'var(--warning)', borderRadius: '50%', boxShadow: isLiveGPS ? '0 0 8px var(--success)' : 'none' }}></div>
                <div style={{ fontSize: '12px', fontWeight: 800 }}>{t('live_gps_status')}</div>
            </div>
            <button 
                onClick={() => setIsLiveGPS(!isLiveGPS)}
                style={{
                  padding: '8px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 900,
                  background: isLiveGPS ? 'var(--primary)' : 'var(--surface-alt)',
                  color: isLiveGPS ? 'white' : 'var(--text)',
                  border: '1px solid var(--primary)', cursor: 'pointer'
                }}>
                {isLiveGPS ? t('real_time').toUpperCase() : t('simulation').toUpperCase()}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
