'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { routes, hospitals } from '@/lib/mockData';
import { Clock, Navigation, Power, Pause, Play, RotateCw } from 'lucide-react';

export default function NavPanel() {
  const { 
    navigating, paused, setPaused, setNavigating, 
    selectedHospital, currentRouteIdx, ambulanceProgress,
    setAmbulanceProgress, setRouteSwitchModalOpen, showNotification,
    missionStage, setMissionStage, t, language,
    patientCondition, heartRate, stopGoldenHour
  } = useApp();

  if (!navigating) return null;

  const hospitalRoutes = routes[selectedHospital] || routes['aiims_rishikesh'];
  const currentRoute = hospitalRoutes[currentRouteIdx] || hospitalRoutes[0];
  const hospital = hospitals.find(h => h.id === selectedHospital);
  const destName = language === 'hi' ? hospital?.name_hi : hospital?.name;

  const totalMin = parseInt(currentRoute?.time || '20');
  const remMinScale = Math.max(0, totalMin * (1 - ambulanceProgress));
  const remMin = Math.floor(remMinScale);
  const remSec = Math.floor((remMinScale - remMin) * 60);
  const timeDisplay = `${remMin.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;

  const stageLabel = missionStage === 'to_patient' ? t('en_route_patient') : t('transporting_hospital');
  const progressPercent = (ambulanceProgress * 100).toFixed(0);

  const handleEnd = () => {
    setNavigating(false);
    setPaused(false);
    setAmbulanceProgress(0);
    setMissionStage('idle');
    stopGoldenHour();
    showNotification(t('mission_ended'), t('ambulance_docked'), 'info');
  };

  const handleSwitch = () => {
    setPaused(true);
    setRouteSwitchModalOpen(true);
  };

  return (
    <div className="nav-panel" style={{
      position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: '500px',
      background: 'rgba(255, 255, 255, 0.95)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 1000, 
      display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%', 
            background: 'var(--primary)', boxShadow: '0 0 0 4px rgba(27,115,232,0.2)',
            animation: 'pulse 2s infinite'
          }}></div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              {stageLabel}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              → {destName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
             <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('condition')}</div>
             <div style={{ 
               fontSize: '11px', fontWeight: 800, 
               color: patientCondition === 'critical' ? 'var(--critical)' : patientCondition === 'deteriorating' ? 'var(--warning)' : 'var(--success)' 
             }}>
               {t(patientCondition as any)}
             </div>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HR</div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--critical)' }}>♥ {heartRate}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative', height: '6px', background: 'var(--surface-alt)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', width: `${progressPercent}%`, 
            background: 'var(--primary)', 
            borderRadius: '3px', transition: 'width 0.5s ease-out' 
          }}></div>
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '35px' }}>
          {progressPercent}%
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
            <Clock size={14} /> {timeDisplay}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setPaused(!paused)}
            style={{
              padding: '6px 10px', borderRadius: '4px', background: 'var(--surface-alt)',
              border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}>
            {paused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
            <span style={{ fontSize: '10px', fontWeight: 700 }}>{paused ? t('resume') : t('pause')}</span>
          </button>
          <button 
            onClick={handleSwitch}
            style={{
              padding: '6px 10px', borderRadius: '4px', background: 'var(--warning-light)',
              border: '1px solid var(--warning)', cursor: 'pointer', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px'
            }}>
            <RotateCw size={14} />
            <span style={{ fontSize: '10px', fontWeight: 700 }}>{t('switch_route')}</span>
          </button>
          <button 
            onClick={handleEnd}
            style={{
              padding: '6px 10px', borderRadius: '4px', background: 'var(--critical)',
              border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px'
            }}>
            <Power size={14} />
            <span style={{ fontSize: '10px', fontWeight: 700 }}>{t('end')}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(27,115,232,0.4); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(27,115,232,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(27,115,232,0); }
        }
      `}</style>
    </div>
  );
}
