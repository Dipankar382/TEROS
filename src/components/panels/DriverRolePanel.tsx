'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { Navigation, MapPin, CheckCircle2, ShieldAlert, Activity, AlertCircle } from 'lucide-react';
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
    t, language
  } = useApp();

  const activeAmbulance = ambulances.find(a => a.id === activeAmbulanceId) || ambulances[0];
  const targetHospital = hospitals.find(h => h.id === selectedHospital);

  const distToPatient = (driverCoords && emergencyCoords) ? calculateDistance(driverCoords, emergencyCoords) : Infinity;
  const distToHospital = (driverCoords && targetHospital) ? calculateDistance(driverCoords, [targetHospital.lat, targetHospital.lng]) : Infinity;

  const canPickUp = distToPatient <= 20;
  const canHandover = distToHospital <= 20;

  const handlePickUp = () => {
    setSosStatus('picked_up');
    showNotification('Patient Picked Up', 'Heading to optimal hospital destination.', 'success');
  };

  const handleHandover = () => {
    setSosStatus('delivered');
    showNotification('Handover Complete', 'Mission successfully ended.', 'success');
    setTimeout(() => {
        setSosStatus('idle');
        setActiveAmbulanceId(null);
    }, 3000);
  };

  // Assign this device to amb1 for demo and enable live GPS by default
  React.useEffect(() => {
    if (!activeAmbulanceId) setActiveAmbulanceId('amb1');
    setIsLiveGPS(true);
  }, [activeAmbulanceId, setActiveAmbulanceId, setIsLiveGPS]);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                {sosStatus === 'requested' ? t('status_requested') : 
                 sosStatus === 'dispatched' ? t('en_route_patient') : 
                 sosStatus === 'picked_up' ? t('transporting_hospital') : t('complete')}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 700 }}>
                 {t('severity')}: {t('critical')}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div style={{ background: 'var(--surface-alt)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
            {sosStatus === 'requested' || sosStatus === 'dispatched' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                   {canPickUp ? '✓ Within 20m range' : `Distance: ${distToPatient.toFixed(1)}m (Need < 20m)`}
                </div>
                <button 
                   disabled={!canPickUp}
                   onClick={handlePickUp}
                   style={{
                    width: '100%', padding: '20px', 
                    background: canPickUp ? 'var(--success)' : 'var(--text-muted)', 
                    color: 'white', border: 'none', borderRadius: '16px',
                    fontSize: '16px', fontWeight: 900, cursor: canPickUp ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.3s'
                   }}>
                   <CheckCircle2 size={24} /> REACHED PATIENT
                </button>
              </div>
            ) : sosStatus === 'picked_up' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                   {canHandover ? '✓ At Hospital Entry' : `To Hospital: ${distToHospital.toFixed(1)}m (Need < 20m)`}
                </div>
                <button 
                   disabled={!canHandover}
                   onClick={handleHandover}
                   style={{
                    width: '100%', padding: '20px', 
                    background: canHandover ? 'var(--primary)' : 'var(--text-muted)', 
                    color: 'white', border: 'none', borderRadius: '16px',
                    fontSize: '16px', fontWeight: 900, cursor: canHandover ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.3s'
                   }}>
                   <Activity size={24} /> MISSION COMPLETE
                </button>
              </div>
            ) : null}
          </div>

          {/* Telemetry Switch */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', background: isLiveGPS ? 'var(--success)' : 'var(--warning)', borderRadius: '50%' }}></div>
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
