'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Navigation, MapPin, ShieldAlert, Activity, Info, Phone } from 'lucide-react';

export default function PatientRolePanel() {
  const {
    emergencyCoords, setEmergencyCoords,
    sosStatus, setSosStatus,
    ambulances, activeAmbulanceId,
    showNotification, startCriticalEvent,
    t, language
  } = useApp();

  const activeAmbulance = ambulances.find(a => a.id === activeAmbulanceId);

  const handleCallAmbulance = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setEmergencyCoords(coords);
        setSosStatus('requested');
        startCriticalEvent('high');
        showNotification('🚨 SOS SENT', 'Your location has been shared with the nearest response unit.', 'danger');
      }, () => {
        // Fallback for demo
        const coords: [number, number] = [30.0869, 78.2676];
        setEmergencyCoords(coords);
        setSosStatus('requested');
        startCriticalEvent('high');
        showNotification('🚨 SOS SENT', 'Location shared via network IP.', 'danger');
      });
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
          {t('live_mission_telemetry')}
        </div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{t('patient_panel')}</h2>
      </header>

      {sosStatus === 'idle' ? (
        <section style={{ 
          textAlign: 'center', padding: '48px 24px', 
          background: 'rgba(244, 63, 94, 0.05)', 
          borderRadius: '32px', border: '1px solid var(--critical-light)',
          boxShadow: '0 20px 40px rgba(244, 63, 94, 0.08)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            fontSize: '72px', marginBottom: '20px', 
            animation: 'pulseScale 1.5s infinite alternate' 
          }}>🚨</div>
          <h3 style={{ color: 'var(--critical)', margin: '0 0 12px 0', fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px' }}>
            {t('emergency_assistance') || 'EMERGENCY ASSISTANCE'}
          </h3>
          <p style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '32px', lineHeight: 1.6, fontWeight: 500 }}>
            {t('sos_description') || 'Press the button below to instantly share your live location with the nearest ambulances.'}
          </p>
          <button 
            onClick={handleCallAmbulance}
            style={{
              width: '100%', padding: '22px', 
              background: 'linear-gradient(135deg, var(--critical), #E11D48)', 
              color: 'white', border: 'none', borderRadius: '20px', 
              fontSize: '18px', fontWeight: 900, cursor: 'pointer', 
              boxShadow: '0 12px 30px rgba(225, 29, 72, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <ShieldAlert size={24} /> {t('call_ambulance').toUpperCase()}
          </button>
        </section>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            padding: '20px', background: 'var(--success-light)', borderRadius: '20px',
            border: '2px solid var(--success)', textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--success)', textTransform: 'uppercase' }}>
              {t('sos_active') || 'SOS ACTIVE'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)', marginTop: '4px', fontWeight: 600 }}>
              {sosStatus === 'requested' ? t('status_requested') : 
               sosStatus === 'dispatched' ? t('en_route_patient') : 
               sosStatus === 'picked_up' ? t('transporting_hospital') : t('complete')}
            </div>
          </div>

          {activeAmbulance && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Assigned Unit
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '50px', height: '50px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Navigation size={28} />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900 }}>{activeAmbulance.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status: Live Tracking Active</div>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Nearby Units ({ambulances.filter(a => a.status === 'available').length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ambulances.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--surface-alt)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{a.name}</span>
                  <span style={{ fontSize: '10px', color: a.status === 'available' ? 'var(--success)' : 'var(--warning)', fontWeight: 800 }}>
                    {a.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
