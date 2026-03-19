'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { routes } from '@/lib/mockData';

export default function RightPanel() {
  const { liveTemp, liveWind, liveVisibility, liveRain, currentRouteIdx, selectedHospital } = useApp();
  
  const hospitalRoutes = routes[selectedHospital] || routes['aiims_rishikesh'];
  const currentRoute = hospitalRoutes[currentRouteIdx] || hospitalRoutes[0];
  const score = currentRoute?.score || 92;

  // Elevation chart
  const elevation = currentRoute?.elevation || [];
  const maxElev = Math.max(...elevation);
  const minElev = Math.min(...elevation);
  const elevRange = maxElev - minElev || 1;

  return (
    <div className="right-panel desktop-only" style={{
      width: '280px', minWidth: '280px', background: 'var(--surface)',
      borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)', zIndex: 10,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
        Route Intelligence
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        
        {/* Terrain Risk Analysis */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Terrain Risk Analysis
          </div>
          {[
            { label: 'Landslide Risk', pct: 55, level: 'Medium', color: 'var(--warning)' },
            { label: 'Road Condition', pct: 75, level: 'Good', color: 'var(--success)' },
            { label: 'Fog Density', pct: 80, level: 'High', color: 'var(--critical)' },
            { label: 'Altitude Change', pct: 45, level: '450m', color: 'var(--primary)' },
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
            Elevation Profile
          </div>
          <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
            {elevation.map((e, i) => {
              const pct = ((e - minElev) / elevRange) * 100;
              const height = 10 + pct * 0.5;
              const hue = pct > 70 ? 0 : pct > 40 ? 35 : 200;
              return (
                <div
                  key={i}
                  title={`${e}m elevation`}
                  style={{
                    flex: 1, borderRadius: '2px 2px 0 0', minHeight: '4px',
                    height: `${height}px`,
                    background: `hsl(${hue}, 70%, 55%)`,
                    transition: 'height 0.3s',
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>Start</span><span>Midpoint</span><span>Hospital</span>
          </div>
        </div>

        {/* Live Conditions */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Live Conditions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Temperature', val: `${liveTemp}°C` },
              { label: 'Visibility', val: `${liveVisibility.toFixed(1)} km` },
              { label: 'Wind', val: `${liveWind} km/h` },
              { label: 'Rain', val: liveRain },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: 'var(--text)' }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Score */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Priority Score
          </div>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '42px', fontWeight: 700, color: 'var(--primary)' }}>
              {score}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Route safety score (higher = safer)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            <div style={{ flex: score, height: '6px', background: 'var(--primary)', borderRadius: '3px' }} />
            <div style={{ flex: 100 - score, height: '6px', background: 'var(--surface-alt)', borderRadius: '3px' }} />
          </div>
        </div>

      </div>
    </div>
  );
}
