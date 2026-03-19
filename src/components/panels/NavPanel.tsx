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
    <div className="nav-panel glass-card" style={{
      position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)', maxWidth: '540px',
      borderRadius: 'var(--radius-lg)', padding: '24px', zIndex: 1000, 
      display: 'flex', flexDirection: 'column', gap: '16px',
      animation: 'slideInTop 0.5s cubic-bezier(0.16, 1, 0.3, 1) reverse'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%', 
            background: 'var(--primary)', boxShadow: '0 0 20px var(--primary)',
            animation: 'pulseGlow 2s infinite'
          }}></div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              {stageLabel}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              Towards: {destName}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ETA</div>
           <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--primary)' }}>{timeDisplay}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '6px', background: 'var(--surface-alt)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ 
            height: '100%', width: `${progressPercent}%`, 
            background: 'var(--primary)', 
            borderRadius: '3px', transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)' 
          }}></div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text)', minWidth: '40px' }}>
          {progressPercent}%
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setPaused(!paused)}
            style={{
              padding: '10px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-alt)',
              border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '12px', fontWeight: 700, transition: 'all 0.2s'
            }}>
            {paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
            <span>{paused ? t('resume') : t('pause')}</span>
          </button>
          
          <button 
            onClick={handleSwitch}
            style={{
              padding: '10px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--warning-light)',
              border: '1px solid var(--warning)', cursor: 'pointer', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '12px', fontWeight: 700, transition: 'all 0.2s'
            }}>
            <RotateCw size={16} />
            <span>{t('switch_route')}</span>
          </button>
        </div>

        <button 
          onClick={handleEnd}
          style={{
            padding: '10px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--critical)',
            border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', fontWeight: 800, boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)', transition: 'all 0.2s'
          }}>
          <Power size={16} />
          <span>{t('end')}</span>
        </button>
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
