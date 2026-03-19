'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { Phone, MapPin, Clock, Activity, ShieldAlert, Heart, Wind } from 'lucide-react';

export default function PatientRolePanel() {
  const {
    emergencyCoords, setEmergencyCoords,
    sosStatus, setSosStatus,
    ambulances, activeAmbulanceId,
    showNotification, startCriticalEvent,
    goldenHour, ambulanceSpeed,
    liveTemp, liveWind, liveVisibility, liveRain,
    heartRate, spo2,
    t, language, emitSync
  } = useApp();

  const activeAmbulance = ambulances.find(a => a.id === activeAmbulanceId);

  const formatGH = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCriticalTime = goldenHour < 600;

  const handleCallAmbulance = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setEmergencyCoords(coords);
        setSosStatus('requested');
        startCriticalEvent('high');
        emitSync('SOS_REQUEST', { latitude: coords[0], longitude: coords[1] });
        showNotification('🚨 SOS SENT', 'Your location has been shared with the nearest response unit.', 'danger');
      }, () => {
        const coords: [number, number] = [30.0869, 78.2676];
        setEmergencyCoords(coords);
        setSosStatus('requested');
        startCriticalEvent('high');
        emitSync('SOS_REQUEST', { latitude: coords[0], longitude: coords[1] });
        showNotification('🚨 SOS SENT', 'Location shared via network IP.', 'danger');
      });
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header>
        <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--critical)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
          EMERGENCY SERVICES
        </div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{t('patient_panel')}</h2>
      </header>

      {sosStatus === 'idle' ? (
        <>
          {/* SOS Button */}
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <button 
              onClick={handleCallAmbulance}
              style={{
                width: '180px', height: '180px', borderRadius: '50%',
                background: 'linear-gradient(145deg, #DC3545, #B02A37)',
                border: '6px solid rgba(220,53,69,0.3)',
                color: 'white', fontSize: '18px', fontWeight: 900,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '8px',
                margin: '0 auto',
                boxShadow: '0 8px 32px rgba(220,53,69,0.4), 0 0 0 0 rgba(220,53,69,0.3)',
                animation: 'emergencyPulse 2s infinite',
                transition: 'all 0.3s'
              }}>
              <Phone size={32} />
              <span>{t('call_ambulance')}</span>
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px', fontWeight: 600 }}>
              {t('sos_description')}
            </p>
          </div>

          {/* Current Weather at Location */}
          <div style={{
            background: 'var(--surface-alt)', borderRadius: '16px', padding: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              CONDITIONS AT YOUR LOCATION
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
        </>
      ) : (
        <>
          {/* Active SOS Status */}
          <div style={{
            padding: '20px', borderRadius: '20px',
            background: sosStatus === 'requested' ? 'var(--critical)' : 'var(--primary)',
            color: 'white',
            animation: sosStatus === 'requested' ? 'pulseScale 1.5s infinite alternate' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <ShieldAlert size={24} />
              <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>
                {sosStatus === 'requested' ? 'AWAITING RESPONSE...' :
                 sosStatus === 'dispatched' ? '🚑 AMBULANCE EN ROUTE' :
                 sosStatus === 'picked_up' ? '🏥 HEADING TO HOSPITAL' : '✅ DELIVERED'}
              </div>
            </div>
            {activeAmbulance && (
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 700 }}>
                Unit: {activeAmbulance.name}
              </div>
            )}
          </div>

          {/* Golden Hour + Speed HUD */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{
              background: isCriticalTime ? 'var(--critical-light)' : 'var(--warning-light)',
              border: `1px solid ${isCriticalTime ? 'var(--critical)' : 'var(--warning)'}`,
              borderRadius: '16px', padding: '16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: isCriticalTime ? 'var(--critical)' : 'var(--warning)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                GOLDEN HOUR
              </div>
              <div style={{
                fontSize: '26px', fontWeight: 900,
                color: isCriticalTime ? 'var(--critical)' : 'var(--warning)',
                fontFamily: "'Space Mono', monospace"
              }}>
                {formatGH(goldenHour)}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {isCriticalTime ? '⚠️ CRITICAL' : '⏱ REMAINING'}
              </div>
            </div>

            <div style={{
              background: 'var(--primary-light)', border: '1px solid var(--primary)',
              borderRadius: '16px', padding: '16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                AMB. SPEED
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--primary)' }}>
                {ambulanceSpeed}<span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>km/h</span>
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                LIVE VELOCITY
              </div>
            </div>
          </div>

          {/* Patient Vitals */}
          <div style={{
            background: 'var(--surface-alt)', borderRadius: '16px', padding: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              YOUR VITALS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Heart size={10} color="var(--critical)" /> HEART RATE
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--critical)' }}>
                  {heartRate} <span style={{ fontSize: '10px', opacity: 0.7 }}>BPM</span>
                </div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  🫁 SPO2 LEVEL
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--primary)' }}>
                  {spo2}<span style={{ fontSize: '10px', opacity: 0.7 }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Conditions */}
          <div style={{
            background: 'var(--surface-alt)', borderRadius: '16px', padding: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              ROUTE CONDITIONS
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

          {/* Emergency Coordinates */}
          {emergencyCoords && (
            <div style={{
              background: 'var(--surface-alt)', borderRadius: '12px', padding: '14px',
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <MapPin size={16} color="var(--critical)" />
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>YOUR LOCATION</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  {emergencyCoords?.[0]?.toFixed(4) || '30.0000'}, {emergencyCoords?.[1]?.toFixed(4) || '78.0000'}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
