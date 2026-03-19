'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { Timer, Zap, MapPin } from 'lucide-react';

export default function MissionTelemetryOverlay() {
  const {
    navigating, missionStage, ambulanceSpeed,
    liveTemp, liveVisibility, liveWind, liveRain,
    ambulanceProgress, goldenHour, patientType
  } = useApp();

  if (!navigating || missionStage === 'idle') return null;

  const isToPatient = missionStage === 'to_patient';
  const score = isToPatient ? 88 : 92;

  // Format Golden Hour
  const formatGH = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCriticalTime = goldenHour < 600; // 10 mins

  // Deterministic elevation profile
  const elevationData = useMemo(() => {
    const seed = [350, 365, 382, 395, 410, 420, 408, 395, 375, 360, 355, 368, 385, 400, 412, 403, 385, 370, 358, 350];
    return seed;
  }, []);

  const minElev = Math.min(...elevationData);
  const maxElev = Math.max(...elevationData);
  const elevRange = maxElev - minElev || 1;
  const currentSegIdx = Math.min(
    Math.floor(ambulanceProgress * elevationData.length),
    elevationData.length - 1
  );
  const liveAltitude = Math.round(elevationData[currentSegIdx] || minElev);

  // Terrain risk scores (0-100)
  const visibilityRisk = Math.max(0, Math.min(100, (1 - liveVisibility / 5) * 100));
  const rainRisk = liveRain === 'Heavy' ? 90 : liveRain === 'Moderate' ? 55 : liveRain === 'Light' ? 25 : 10;
  const windRisk = Math.max(0, Math.min(100, (liveWind / 50) * 100));
  const altitudeRisk = Math.max(0, Math.min(100, ((liveAltitude - 300) / 200) * 100));
  const compositeRisk = Math.round((visibilityRisk * 0.35 + rainRisk * 0.30 + windRisk * 0.20 + altitudeRisk * 0.15));

  const riskLabel = compositeRisk > 64 ? 'HIGH' : compositeRisk > 35 ? 'MEDIUM' : 'LOW';
  const riskColor = compositeRisk > 64 ? '#EF4444' : compositeRisk > 35 ? '#F59E0B' : '#10B981';
  const riskBg   = compositeRisk > 64 ? 'rgba(239,68,68,0.12)' : compositeRisk > 35 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';

  const risks = [
    { label: 'Landslide', value: Math.round(rainRisk * 0.6 + altitudeRisk * 0.4) },
    { label: 'Fog / Vis', value: Math.round(visibilityRisk) },
    { label: 'High Wind', value: Math.round(windRisk) },
  ];

  const speedColor = ambulanceSpeed > 60 ? '#10B981' : ambulanceSpeed > 30 ? '#F59E0B' : '#6B7280';

  return (
    <div className="telemetry-overlay" style={{
      position: 'absolute',
      top: '20px',
      left: '420px',   /* Positioned top-left of the map area, next to LeftPanel (400px) */
      zIndex: 950,
      width: '280px',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      borderRadius: '20px',
      padding: '16px',
      pointerEvents: 'none',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: 'slideInTop 0.5s ease-out'
    }}>
      
      {/* ── Mission Header & Golden Hour ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', letterSpacing: '1.2px', marginBottom: '4px' }}>Golden Hour</div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            color: isCriticalTime ? '#ef4444' : '#10b981',
            animation: isCriticalTime ? 'pulseDanger 1s infinite alternate' : 'none'
          }}>
            <Timer size={18} strokeWidth={2.5} />
            <span style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'monospace' }}>{formatGH(goldenHour)}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', letterSpacing: '1.2px', marginBottom: '4px' }}>AI Score</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{score}</div>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

      {/* ── Speed & Risk Row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Zap size={16} color={speedColor} fill={speedColor} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: speedColor, lineHeight: 1 }}>
              {Math.round(ambulanceSpeed)}<span style={{ fontSize: '10px', marginLeft: '2px', color: '#94a3b8' }}>km/h</span>
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>LIVE SPEED</div>
          </div>
        </div>
        <div style={{
          background: riskBg,
          border: `1px solid ${riskColor}33`,
          borderRadius: '10px',
          padding: '6px 12px',
          textAlign: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: riskColor, letterSpacing: '0.5px' }}>{riskLabel} RISK</div>
          <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginTop: '1px' }}>Terrain Analysis</div>
        </div>
      </div>

      {/* ── Elevation Profile ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} color="#3b82f6" />
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase' }}>Elevation Profile</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc' }}>{liveAltitude}m</span>
        </div>
        <div style={{ height: '32px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
          {elevationData.map((e: number, i: number) => {
            const pct = ((e - minElev) / elevRange) * 100;
            const isPast = i < currentSegIdx;
            const isCur = i === currentSegIdx;
            return (
              <div key={i} style={{
                flex: 1,
                height: `${4 + pct * 0.28}px`,
                borderRadius: '1px',
                background: isCur ? '#3b82f6' : isPast ? 'rgba(59,130,246,0.5)' : 'rgba(148,163,184,0.15)',
                transition: 'all 0.3s ease',
                boxShadow: isCur ? '0 0 8px rgba(59,130,246,0.6)' : 'none'
              }} />
            );
          })}
        </div>
      </div>

      {/* ── Terrain Risk Bars ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {risks.map(r => {
          const c = r.value > 64 ? '#EF4444' : r.value > 35 ? '#F59E0B' : '#10B981';
          return (
            <div key={r.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '4px', fontWeight: 700 }}>
                <span style={{ color: '#94a3b8', textTransform: 'uppercase' }}>{r.label}</span>
                <span style={{ color: c }}>{r.value}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${r.value}%`, background: c, transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Animated Keyframes ── */}
      <style>{`
        @keyframes pulseDanger {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0.8; transform: scale(0.98); }
        }
        @keyframes slideInTop {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
