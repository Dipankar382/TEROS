'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { Hospital as HospitalIcon, Users, Bed, Activity, Search, Edit2, Save } from 'lucide-react';
import { Hospital } from '@/lib/mockData';

export default function HospitalRolePanel() {
  const {
    hospitalData, setHospitalData,
    sosStatus, ambulances, activeAmbulanceId,
    emergencyCoords, heartRate, spo2,
    language, t
  } = useApp();

  const [search, setSearch] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const filteredHospitals = hospitalData.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.name_hi.toLowerCase().includes(search.toLowerCase())
  );

  const activeAmbulance = ambulances.find(a => a.id === activeAmbulanceId);

  const updateBeds = (hospitalId: string, type: 'icu' | 'emergency', delta: number) => {
    setHospitalData((prev: Hospital[]) => prev.map((h: Hospital) => {
      if (h.id === hospitalId) {
        const newBeds = { ...h.beds };
        newBeds[type] = {
          ...newBeds[type],
          available: Math.max(0, Math.min(newBeds[type].total, newBeds[type].available + delta))
        };
        return { ...h, beds: newBeds };
      }
      return h;
    }));
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
          {t('live_mission_telemetry')}
        </div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{t('hospital_panel')}</h2>
      </header>

      {/* Active Mission Monitoring */}
      {(sosStatus !== 'idle') && (
        <section style={{ 
          background: 'rgba(59, 130, 246, 0.05)', 
          border: '1px solid var(--primary-light)', 
          borderRadius: '24px', padding: '24px',
          boxShadow: '0 10px 30px rgba(59, 130, 246, 0.1)',
          animation: 'emergency pulse 2s infinite',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Activity size={20} color="var(--primary)" className="animate-pulse" />
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t('active_mission_data')}
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px', background: 'var(--surface)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 800 }}>HEART RATE</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--critical)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {heartRate} <span style={{ fontSize: '12px', opacity: 0.7 }}>BPM</span>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '16px', background: 'var(--surface)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 800 }}>SPO2 LEVEL</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)' }}>{spo2}<span style={{ fontSize: '12px', opacity: 0.7 }}>%</span></div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '20px', padding: '12px', borderRadius: '12px', 
            background: 'var(--primary-light)', fontSize: '12px', fontWeight: 700 
          }}>
            <div style={{ color: 'var(--text)', marginBottom: '4px' }}>
              🚑 {t('call_ambulance').toUpperCase()}: <span style={{ color: 'var(--text)', fontWeight: 900 }}>{activeAmbulance?.name || t('dispatch').toUpperCase()}</span>
            </div>
            <div style={{ color: 'var(--text)' }}>
              📍 {t('active_stage').toUpperCase()}: <span style={{ color: 'var(--primary)', fontWeight: 900 }}>
                {sosStatus === 'requested' ? t('status_requested') : 
                 sosStatus === 'dispatched' ? t('en_route_patient') : 
                 sosStatus === 'picked_up' ? t('transporting_hospital') : t('complete')}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Hospital Management List */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
          <input 
            type="text" 
            placeholder={t('search_hospitals')} 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px',
              border: '1px solid var(--border)', background: 'var(--surface-alt)',
              fontSize: '13px'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredHospitals.map(h => (
            <div key={h.id} className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>{language === 'hi' ? h.name_hi : h.name}</h3>
                <button 
                  onClick={() => setEditingId(editingId === h.id ? null : h.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                >
                  {editingId === h.id ? <Save size={16} /> : <Edit2 size={16} />}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'var(--surface-alt)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Bed size={10} /> ICU
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{h.beds.icu.available}/{h.beds.icu.total}</span>
                    {editingId === h.id && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => updateBeds(h.id, 'icu', -1)} style={{ padding: '0 4px', background: 'var(--border)', border: 'none', borderRadius: '4px' }}>-</button>
                        <button onClick={() => updateBeds(h.id, 'icu', 1)} style={{ padding: '0 4px', background: 'var(--border)', border: 'none', borderRadius: '4px' }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={10} /> EMERGENCY
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{h.beds.emergency.available}/{h.beds.emergency.total}</span>
                    {editingId === h.id && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => updateBeds(h.id, 'emergency', -1)} style={{ padding: '0 4px', background: 'var(--border)', border: 'none', borderRadius: '4px' }}>-</button>
                        <button onClick={() => updateBeds(h.id, 'emergency', 1)} style={{ padding: '0 4px', background: 'var(--border)', border: 'none', borderRadius: '4px' }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
