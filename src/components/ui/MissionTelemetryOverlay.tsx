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
      position: 'absolute', top: '16px', left: '16px', width: '280px',
      borderRadius: 'var(--radius)', padding: '16px', zIndex: 1100,
      display: 'flex', flexDirection: 'column', gap: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      animation: 'slideInTop 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* AI Intelligence Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ 
          padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800,
          background: 'var(--primary-light)', color: 'var(--primary)',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          AI PRIORITY: {score}
        </div>
        <div style={{ color: 'var(--primary)', opacity: 0.8 }}><Activity size={16} /></div>
      </div>

      {/* Primary Stats Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Velocity
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            {ambulanceSpeed}<span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>KM/H</span>
          </div>
        </div>
        
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, color: isCriticalTime ? 'var(--critical)' : 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Golden Hour
          </div>
          <div style={{ 
            fontSize: '22px', fontWeight: 900, 
            color: isCriticalTime ? 'var(--critical)' : 'var(--text)',
            fontFamily: 'var(--font-mono)'
          }}>
             {formatGH(goldenHour)}
          </div>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)' }} />

      {/* Risk Metrics - Clean & Simple */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>RISK TERRAIN</span>
          <span style={{ fontSize: '10px', fontWeight: 900, color: landslideRisk > 60 ? 'var(--critical)' : 'var(--success)' }}>
            {landslideRisk > 60 ? 'HIGH' : 'LOW'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700 }}>
             <span style={{ color: 'var(--text-secondary)' }}>Landslide</span>
             <span style={{ color: landslideRisk > 60 ? 'var(--critical)' : 'var(--success)' }}>{landslideRisk}%</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${landslideRisk}%`, background: landslideRisk > 60 ? 'var(--critical)' : 'var(--success)', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Fog Density</span>
            <span>{Math.round(fogRisk)}%</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Altitude</span>
            <span>{liveAltitude}m AGL</span>
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
