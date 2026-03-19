'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { hospitals } from '@/lib/mockData';

export default function RightPanel() {
  const { 
    liveTemp, liveWind, liveVisibility, liveRain, 
    currentRouteIdx, selectedHospital, language, t,
    missionStage, ambulanceProgress, setPaused, setRouteSwitchModalOpen
  } = useApp();
  
  const isToPatient = missionStage === 'to_patient';
  
  // For Stage 2, we use mockData routes for additional metadata (score, elevation)
  // For Stage 1 (dynamic OSRM), we generate or use defaults
  const score = isToPatient ? 88 : 92; // Default scores

  // Elevation chart - in real app, this would come from OSRM/DEM API
  // For now, we generate a synthetic profile if mockData is missing
  const elevationData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => 350 + Math.sin(i / 3) * 50 + ((i * 17) % 10));
  }, []);

  const maxElev = Math.max(...elevationData, 1);
  const minElev = Math.min(...elevationData);
  const elevRange = maxElev - minElev || 1;

  // Calculate current elevation segment
  const currentSegIdx = Math.floor(ambulanceProgress * elevationData.length);

  // Semi-dynamic risks based on route and live sensors
  const landslideRisk = Math.min(95, (100 - liveVisibility * 20) + (liveRain === 'Moderate' ? 20 : liveRain === 'Heavy' ? 40 : 0));
  const fogRisk = Math.max(0, 100 - liveVisibility * 30);

  return (
    <div className="right-panel desktop-only" style={{
      width: '280px', minWidth: '280px', background: 'var(--surface)',
      borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)', zIndex: 10,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
        {t('route_intelligence')}
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        
        {/* Terrain Risk Analysis */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {t('terrain_risk_analysis')}
          </div>
          {[
            { label: t('landslide_risk'), pct: landslideRisk, level: landslideRisk > 70 ? 'High' : landslideRisk > 40 ? 'Medium' : 'Low', color: landslideRisk > 70 ? 'var(--critical)' : landslideRisk > 40 ? 'var(--warning)' : 'var(--success)' },
            { label: t('road_condition'), pct: 75, level: 'Good', color: 'var(--success)' },
            { label: t('fog_density'), pct: fogRisk, level: fogRisk > 70 ? 'High' : fogRisk > 40 ? 'Medium' : 'Low', color: fogRisk > 70 ? 'var(--critical)' : fogRisk > 40 ? 'var(--warning)' : 'var(--success)' },
            { label: t('altitude_change'), pct: 45, level: '450m', color: 'var(--primary)' },
          ].map((risk, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text)' }}>{risk.label}</span>
                <span style={{ fontWeight: 700, color: risk.color }}>{risk.level}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--surface-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${risk.pct}%`, background: risk.color, borderRadius: '3px', transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Elevation Profile */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {t('elevation_profile')}
          </div>
          <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', gap: '2px', position: 'relative' }}>
            {elevationData.map((e: number, i: number) => {
              const pct = ((e - minElev) / elevRange) * 100;
              const height = 10 + pct * 0.5;
              const isCurrent = i === currentSegIdx;
              const barColor = isCurrent ? 'var(--primary)' : `hsl(${pct > 70 ? 0 : pct > 40 ? 35 : 200}, 70%, 55%)`;
              return (
                <div
                  key={i}
                  title={`${e}m elevation`}
                  style={{
                    flex: 1, borderRadius: '2px 2px 0 0', minHeight: '4px',
                    height: `${height}px`,
                    background: barColor,
                    opacity: isCurrent ? 1 : 0.6,
                    boxShadow: isCurrent ? '0 0 10px var(--primary)' : 'none',
                    transition: 'all 0.3s',
                    position: 'relative'
                  }}
                >
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                      fontSize: '7px', fontWeight: 900, color: 'var(--primary)', whiteSpace: 'nowrap',
                      background: 'var(--surface)', padding: '0 2px', borderRadius: '2px'
                    }}>
                      LIVE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>{t('start')}</span><span>{t('midpoint')}</span><span>{isToPatient ? t('incident_site') : t('hospital')}</span>
          </div>
        </div>

        {/* Live Conditions */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {t('live_conditions')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: t('temperature'), val: `${liveTemp}°C` },
              { label: t('visibility'), val: `${liveVisibility.toFixed(1)} km` },
              { label: t('wind'), val: `${liveWind} km/h` },
              { label: t('rain'), val: liveRain },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px', color: 'var(--text)' }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Score */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {t('priority_score')}
          </div>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '42px', fontWeight: 700, color: 'var(--primary)' }}>
              {score}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t('route_safety_score')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            <div style={{ flex: score, height: '6px', background: 'var(--primary)', borderRadius: '3px' }} />
            <div style={{ flex: 100 - score, height: '6px', background: 'var(--surface-alt)', borderRadius: '3px' }} />
          </div>

          {/* Manual Reroute Button */}
          {missionStage !== 'idle' && (
            <button
              onClick={() => {
                setPaused(true);
                setRouteSwitchModalOpen(true);
              }}
              style={{
                width: '100%', marginTop: '24px', padding: '14px', borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)',
                color: 'white', border: 'none', fontWeight: 800, fontSize: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M21 2v6h-6M3 22v-6h6M21 13a9 9 0 11-3-7.7L21 8M3 11a9 9 0 013-7.7L3 6" />
              </svg>
              {t('switch_route').toUpperCase()}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
