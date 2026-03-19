'use client';

import React, { useState } from 'react';
import { routes, weatherData } from '@/lib/mockData';
import { Navigation, MapPin, ShieldAlert, Activity, Globe, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState('dispatch');
  const [hospitalFilter, setHospitalFilter] = useState('');
  
  const {
    patientType, setPatientType,
    missionStage, setMissionStage,
    goldenHour, criticalEventActive, startCriticalEvent, stopGoldenHour,
    selectedHospital, setSelectedHospital,
    navigating, setNavigating,
    setAmbulanceProgress, setPaused,
    emergencyCoords, setEmergencyCoords,
    mockEmergencies,
    showNotification,
    hospitalData,
    ambulanceSpeed,
    simSpeedMultiplier, setSimSpeedMultiplier,
    findOptimalHospital,
    language, setLanguage, t,
    manualHospitalSelection, setManualHospitalSelection,
    patientCondition, setPatientCondition, heartRate, spo2
  } = useApp();

  const [pickupLocation, setPickupLocation] = useState('Rishikesh, Uttarakhand');
  const [selectedMockId, setSelectedMockId] = useState('');

  const formatGH = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCriticalTime = goldenHour < 900;

  const handleDispatch = () => {
    if (navigating) {
      setNavigating(false);
      setPaused(false);
      setAmbulanceProgress(0);
      setMissionStage('idle');
      stopGoldenHour();
      return;
    }
    setNavigating(true);
    setAmbulanceProgress(0);
    setMissionStage('to_patient');
    setPaused(false);
    showNotification(t('start_dispatch'), t('en_route_patient'), 'success');
  };

  const handleLocateEmergency = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setEmergencyCoords(coords);
        setPickupLocation(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)} (Current)`);
        startCriticalEvent('high');
        findOptimalHospital(coords);
        showNotification(t('live_incidents'), t('critical_window'), 'warning');
      }, () => {
        const coords: [number, number] = [30.0869, 78.2676];
        setEmergencyCoords(coords);
        setPickupLocation(`30.0869, 78.2676 (Emergency Site)`);
        startCriticalEvent('high');
        findOptimalHospital(coords);
        showNotification(t('live_incidents'), t('critical_window'), 'warning');
      });
    }
  };

  const handleMockSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedMockId(id);
    const mock = mockEmergencies.find(m => m.id === id);
    if (mock) {
      const coords: [number, number] = [mock.lat, mock.lng];
      setEmergencyCoords(coords);
      setPickupLocation(mock.name);
      startCriticalEvent(mock.severity || 'medium');
      findOptimalHospital(coords);
      showNotification('Mission Updated', `Emergency: ${mock.name}. Golden hour active.`, 'danger');
    }
  };

  const filteredHospitals = hospitalData.filter(h =>
    h.name.toLowerCase().includes(hospitalFilter.toLowerCase()) ||
    h.name_hi.includes(hospitalFilter)
  );

  return (
    <div className="left-panel" style={{
      width: '340px', background: 'var(--surface)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)', zIndex: 10,
      overflow: 'hidden', flexShrink: 0
    }}>
      {/* Top Header with Language Toggle */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '18px' }}>
          <Activity size={20} /> TEROS
        </div>
        <button 
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px',
            background: 'var(--surface-alt)', border: '1px solid var(--border)',
            borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
            color: 'var(--text-secondary)'
          }}>
          <Globe size={14} /> {language === 'en' ? 'हिन्दी' : 'English'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
        {['dispatch', 'hospitals', 'weather'].map(tab => (
          <div key={tab} 
               onClick={() => setActiveTab(tab)}
               style={{
            flex: 1, padding: '12px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.8px', cursor: 'pointer',
            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {t(tab as any)}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* DISPATCH TAB */}
        {activeTab === 'dispatch' && (
          <div>
            {/* Patient Classification */}
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {t('patient_classification')}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <button 
                onClick={() => startCriticalEvent('high')}
                style={{
                  flex: 1, padding: '10px', border: `2px solid ${patientType === 'critical' ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: patientType === 'critical' ? 'var(--danger)' : 'var(--surface)',
                  color: patientType === 'critical' ? '#fff' : 'var(--text)',
                  textAlign: 'center', cursor: 'pointer',
                }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>🚨</div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('critical')}</div>
              </button>
              <button 
                onClick={() => setPatientType('normal')}
                style={{
                  flex: 1, padding: '10px', border: `2px solid ${patientType === 'normal' ? 'var(--success)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: patientType === 'normal' ? 'var(--success-light)' : 'var(--surface)',
                  color: patientType === 'normal' ? 'var(--success)' : 'var(--text)',
                  textAlign: 'center', cursor: 'pointer',
                }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>🩺</div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('normal')}</div>
              </button>
            </div>

            {/* Golden Hour */}
            {patientType === 'critical' && (
              <div style={{
                background: isCriticalTime 
                  ? 'linear-gradient(135deg, var(--critical-light), rgba(239,68,68,0.2))' 
                  : 'linear-gradient(135deg, var(--warning-light), rgba(245,158,11,0.25))',
                border: `1px solid ${isCriticalTime ? 'var(--critical)' : 'var(--warning)'}`,
                borderRadius: 'var(--radius-sm)', padding: '14px',
                textAlign: 'center', marginBottom: '12px',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: isCriticalTime ? 'var(--critical)' : 'var(--warning)', marginBottom: '4px' }}>
                  {t('golden_hour_remaining')} {simSpeedMultiplier > 1 && `(${simSpeedMultiplier}x)`}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '32px', fontWeight: 700, color: isCriticalTime ? 'var(--critical)' : 'var(--warning)', letterSpacing: '2px' }}>
                  {formatGH(goldenHour)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {t('critical_window')}
                </div>
              </div>
            )}

            {/* Pickup Location */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {t('mock_emergencies')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '10px', fontWeight: 700 }}>
                  <ShieldAlert size={12} /> {t('live_incidents')}
                </div>
              </div>
              <select 
                value={selectedMockId} 
                onChange={handleMockSelect}
                style={{
                  width: '100%', padding: '10px 12px', border: '2px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  fontSize: '13px', fontFamily: 'inherit', color: 'var(--text)', background: 'var(--surface)', outline: 'none',
                  cursor: 'pointer', marginBottom: '12px', fontWeight: 600
                }}
              >
                <option value="">{t('select_scenario')}</option>
                {mockEmergencies.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('manual_location')}
                </label>
                <button onClick={handleLocateEmergency} style={{
                  background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, 
                  display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0
                }}>
                  <MapPin size={12} /> {t('locate_me')}
                </button>
              </div>
              <input type="text" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} placeholder="Wait for location or type..." style={{
                width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontSize: '13px', fontFamily: 'inherit', color: 'var(--text)', background: 'var(--surface)', outline: 'none',
              }} />
            </div>

            {/* Patient Status Section */}
          {missionStage !== 'idle' && (
            <div style={{ 
              marginBottom: '20px', padding: '16px', background: 'var(--surface-alt)', 
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('critical_status')}
                </h3>
                <div style={{ 
                  padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800,
                  background: patientCondition === 'critical' ? 'var(--critical-light)' : patientCondition === 'deteriorating' ? 'var(--warning-light)' : 'var(--success-light)',
                  color: patientCondition === 'critical' ? 'var(--critical)' : patientCondition === 'deteriorating' ? 'var(--warning)' : 'var(--success)',
                  textTransform: 'uppercase'
                }}>
                  {t(patientCondition as any)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('heart_rate')}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--critical)' }}>{heartRate}</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('bpm')}</span>
                  </div>
                </div>
                <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('spo2')}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>{spo2}%</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {(['stable', 'deteriorating', 'critical'] as const).map(cond => (
                  <button
                    key={cond}
                    onClick={() => setPatientCondition(cond)}
                    style={{
                      flex: 1, padding: '6px 4px', borderRadius: '44px', fontSize: '10px', fontWeight: 700,
                      cursor: 'pointer', border: '1px solid',
                      background: patientCondition === cond ? 'var(--text)' : 'transparent',
                      color: patientCondition === cond ? 'var(--surface)' : 'var(--text-secondary)',
                      borderColor: 'var(--border-strong)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t(cond as any)}
                  </button>
                ))}
              </div>
            </div>
          )}

            {/* Destination Selection */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {t('optimal_destination')}
                </label>
                <div 
                  onClick={() => setManualHospitalSelection(!manualHospitalSelection)}
                  style={{ 
                    fontSize: '10px', fontWeight: 700, 
                    color: manualHospitalSelection ? 'var(--warning)' : 'var(--success)', 
                    background: manualHospitalSelection ? 'var(--warning-light)' : 'var(--success-light)', 
                    padding: '2px 8px', borderRadius: '10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                  {manualHospitalSelection ? t('manual_override') : t('auto_selected')}
                </div>
              </div>
              
              {manualHospitalSelection ? (
                <select 
                  value={selectedHospital} 
                  onChange={e => setSelectedHospital(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', border: '2px solid var(--warning)', borderRadius: 'var(--radius-sm)',
                    fontSize: '13px', fontFamily: 'inherit', color: 'var(--text)', background: 'var(--surface)', outline: 'none',
                    fontWeight: 700
                  }}
                >
                  {hospitalData.map(h => (
                    <option key={h.id} value={h.id}>{language === 'hi' ? h.name_hi : h.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{
                  width: '100%', padding: '12px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)',
                  fontSize: '14px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <CheckCircle2 size={18} />
                  {language === 'hi' 
                    ? hospitalData.find(h => h.id === selectedHospital)?.name_hi 
                    : hospitalData.find(h => h.id === selectedHospital)?.name || 'Calculating...'}
                </div>
              )}
              
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {manualHospitalSelection ? t('select_hospital') : t('ai_selected_info')}
              </div>
            </div>

            {/* Mission Info & Speedometer */}
            {navigating && (
              <div style={{
                background: 'var(--primary-light)', border: '1px solid var(--primary)', 
                borderRadius: 'var(--radius-sm)', padding: '12px', marginTop: '16px', marginBottom: '8px',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {t('live_mission_telemetry')}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      {ambulanceSpeed}
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>KM/H</span>
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {t('current_velocity')}
                    </div>
                  </div>
                  
                  <div style={{ width: '1px', height: '30px', background: 'rgba(27,115,232,0.2)' }}></div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                       {missionStage === 'to_patient' ? t('to_site') : t('to_hospital')}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {t('active_stage')}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', height: '4px', background: 'rgba(27,115,232,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${(ambulanceSpeed / 200) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease-out' }}></div>
                </div>
              </div>
            )}

            {/* Simulation Speed Control */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {t('sim_speed')}: {simSpeedMultiplier}x
                </label>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {simSpeedMultiplier === 1 ? t('real_time') : t('accelerated')}
                </div>
              </div>
              <input 
                type="range" min="1" max="120" step="1"
                value={simSpeedMultiplier}
                onChange={e => setSimSpeedMultiplier(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>1x</span>
                <span>60x</span>
                <span>120x</span>
              </div>
            </div>

            {/* Dispatch Button */}
            <button onClick={handleDispatch} style={{
              width: '100%', padding: '12px', 
              background: navigating ? 'var(--success)' : 'var(--primary)', 
              color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', 
              fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <Navigation size={16} />
              {navigating ? (missionStage === 'to_patient' ? t('en_route_patient') : t('transporting_hospital')) : t('start_dispatch')}
            </button>
          </div>
        )}

        {/* HOSPITALS TAB */}
        {activeTab === 'hospitals' && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {t('live_bed_availability')}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <input 
                type="text" 
                placeholder={t('search_hospitals')}
                value={hospitalFilter}
                onChange={e => setHospitalFilter(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  fontSize: '13px', fontFamily: 'inherit', color: 'var(--text)', background: 'var(--surface)', outline: 'none',
                }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredHospitals.map(h => (
                <div key={h.id} style={{ 
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', 
                  padding: '12px', transition: 'all 0.2s' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: 'var(--text)' }}>
                        {language === 'hi' ? h.name_hi : h.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{h.dist} away</div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: h.open ? 'var(--success-light)' : 'var(--critical-light)',
                      color: h.open ? 'var(--success)' : 'var(--critical)',
                    }}>
                      {h.open ? t('open') : t('closed')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(h.beds).map(([type, data]) => {
                      const label = type.charAt(0).toUpperCase() + type.slice(1);
                      let cls: { bg: string; color: string };
                      if (data.available === 0) cls = { bg: 'var(--critical-light)', color: 'var(--critical)' };
                      else if (data.available <= 3) cls = { bg: 'var(--warning-light)', color: 'var(--warning)' };
                      else cls = { bg: 'var(--success-light)', color: 'var(--success)' };
                      return (
                        <div key={type} style={{
                          padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 600,
                          background: cls.bg, color: cls.color,
                        }}>
                          {label}: {data.available}/{data.total}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {(language === 'hi' ? h.specialties_hi : h.specialties).map(s => (
                      <span key={s} style={{
                        fontSize: '10px', padding: '2px 6px', background: 'var(--primary-light)',
                        color: 'var(--primary)', borderRadius: '4px', fontWeight: 600,
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEATHER TAB */}
        {activeTab === 'weather' && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {t('regional_weather')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {weatherData.map(w => (
                <div key={w.location} style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                        {w.icon} {language === 'hi' ? w.location_hi : w.location}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {language === 'hi' ? w.condition_hi : w.condition}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{w.temp}°C</div>
                      {w.severe && (
                        <div style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                          background: 'var(--critical-light)', color: 'var(--critical)',
                          textTransform: 'uppercase', marginTop: '4px', display: 'inline-block',
                        }}>
                          {t('severe')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>💧 {w.humidity}%</span>
                    <span>💨 {w.wind} km/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
