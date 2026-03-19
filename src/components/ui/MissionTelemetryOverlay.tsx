'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { Timer, Zap, MapPin, Activity } from 'lucide-react';

export default function MissionTelemetryOverlay() {
  const {
    navigating, missionStage, ambulanceSpeed,
    liveVisibility, liveWind, liveRain,
    ambulanceProgress, goldenHour, score, elevationData, currentSegIdx
  } = useApp();

  if (!navigating || missionStage === 'idle') return null;

  // Format Golden Hour
  const formatGH = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCriticalTime = goldenHour < 600; // 10 mins
  const liveAltitude = Math.round(elevationData[currentSegIdx] || 0);

  // Terrain risk factors derived from environment
  const visibilityRisk = Math.max(0, Math.min(100, (1 - liveVisibility / 5) * 100));
  const rainRisk = liveRain === 'Heavy' ? 90 : liveRain === 'Moderate' ? 55 : liveRain === 'Light' ? 25 : 10;
  const landslideRisk = Math.round(rainRisk * 0.7 + (liveAltitude / 2000) * 30);
  const fogRisk = Math.max(0, 100 - liveVisibility * 20);

  return (
    <div className="telemetry-overlay glass-card" style={{
      position: 'absolute', top: '24px', left: '420px', width: '300px',
      borderRadius: 'var(--radius-lg)', padding: '24px', zIndex: 1100,
      display: 'flex', flexDirection: 'column', gap: '20px',
      animation: 'slideInTop 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* AI Intelligence Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ 
          padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
          background: 'var(--primary-light)', color: 'var(--primary)',
          textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid currentColor'
        }}>
          AI PRIORITY: {score}
        </div>
        <div style={{ color: 'var(--text-muted)' }}><Activity size={18} /></div>
      </div>

      {/* Primary HUD Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ textAlign: 'left', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Velocity
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            {ambulanceSpeed}<span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>km/h</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: isCriticalTime ? 'var(--critical)' : 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Golden Hour
          </div>
          <div style={{ 
            fontSize: '26px', fontWeight: 900, 
            color: isCriticalTime ? 'var(--critical)' : 'var(--text)',
            display: 'flex', alignItems: 'center', gap: '4px' 
          }}>
             {formatGH(goldenHour)}
          </div>
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--border)' }} />

      {/* Terrain & Route Intel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            <MapPin size={16} color="var(--primary)" /> 
            {missionStage === 'to_patient' ? 'Rescue Site' : 'Base Hospital'}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--success)', opacity: 0.9 }}>LIVE INTEL</div>
        </div>

        {/* Risk Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '6px', fontWeight: 800 }}>
               <span style={{ color: 'var(--text-muted)' }}>LANDSLIDE RISK</span>
               <span style={{ color: landslideRisk > 60 ? 'var(--critical)' : 'var(--success)' }}>
                 {landslideRisk}%
               </span>
            </div>
            <div style={{ height: '4px', background: 'var(--surface-alt)', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ height: '100%', width: `${landslideRisk}%`, background: landslideRisk > 60 ? 'var(--critical)' : 'var(--success)', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-muted)' }}>FOG DENSITY</span>
            <span style={{ color: fogRisk > 70 ? 'var(--critical)' : fogRisk > 40 ? 'var(--warning)' : 'var(--success)' }}>
              {Math.round(fogRisk)}%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-muted)' }}>ALTITUDE</span>
            <span style={{ color: 'var(--text)' }}>{liveAltitude}m AGL</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInTop {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
