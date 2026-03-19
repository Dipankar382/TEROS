'use client';

import React, { useState, useMemo } from 'react';
import { routes, weatherData } from '@/lib/mockData';
import { Navigation, MapPin, ShieldAlert, Activity, Globe, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState('dispatch');
  
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
    patientCondition, setPatientCondition, heartRate, spo2,
    liveTemp, liveWind, liveVisibility, liveRain,
    currentRouteIdx, ambulanceProgress,
    isLiveGPS, setIsLiveGPS, driverCoords, setDriverCoords,
    setActiveRole
  } = useApp();

  const [showTelemetry, setShowTelemetry] = useState(false);
  
  const isToPatient = missionStage === 'to_patient';
  const score = isToPatient ? 88 : 92;

  const elevationData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => 350 + Math.sin(i / 3) * 50 + ((i * 17) % 10));
  }, []);

  const maxElev = Math.max(...elevationData, 1);
  const minElev = Math.min(...elevationData);
  const elevRange = maxElev - minElev || 1;

  const currentSegIdx = Math.floor(ambulanceProgress * elevationData.length);

  const landslideRisk = Math.min(95, (100 - liveVisibility * 20) + (liveRain === 'Moderate' ? 20 : liveRain === 'Heavy' ? 40 : 0));
  const fogRisk = Math.max(0, 100 - liveVisibility * 30);

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


  return (
    <div className="left-panel glass-panel" style={{
      width: '380px', height: '100%',
      display: 'flex', flexDirection: 'column',
      zIndex: 100, overflow: 'hidden', flexShrink: 0,
      borderRight: '1px solid var(--border)'
    }}>
      {/* Top Header with Language Toggle */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: 900, fontSize: '22px', letterSpacing: '-0.5px' }}>
          <Activity size={24} /> TEROS
        </div>
        <button 
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            background: 'var(--surface-alt)', border: '1px solid var(--border)',
            borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 800,
            color: 'var(--text-secondary)', transition: 'all 0.2s'
          }}>
          <Globe size={14} /> {language === 'en' ? 'HI' : 'EN'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 12px', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
        {['dispatch', 'hospitals', 'weather'].map(tab => (
          <div key={tab} 
               onClick={() => setActiveTab(tab)}
               style={{
            flex: 1, padding: '16px 8px', textAlign: 'center', fontSize: '10px', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '1.2px', cursor: 'pointer',
            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
            position: 'relative', transition: 'all 0.3s'
          }}>
            {t(tab as any)}
            {activeTab === tab && (
              <div style={{ position: 'absolute', bottom: 0, left: '25%', right: '25%', height: '3px', background: 'var(--primary)', borderRadius: '3px 3px 0 0' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* DISPATCH TAB */}
        {activeTab === 'dispatch' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Patient & Mission Priority */}
            <section>
              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
                {t('patient_classification')}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => startCriticalEvent('high')}
                  style={{
                    flex: 1, padding: '16px 12px', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: patientType === 'critical' ? 'var(--critical-light)' : 'var(--surface-alt)',
                    color: patientType === 'critical' ? 'var(--critical)' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                  }}>
                  <div style={{ fontSize: '18px' }}>🚨</div>
                  <div style={{ fontSize: '10px', fontWeight: 800 }}>CRITICAL</div>
                </button>
                <button 
                  onClick={() => setPatientType('normal')}
                  style={{
                    flex: 1, padding: '16px 12px', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: patientType === 'normal' ? 'var(--success-light)' : 'var(--surface-alt)',
                    color: patientType === 'normal' ? 'var(--success)' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                  }}>
                  <div style={{ fontSize: '18px' }}>🩺</div>
                  <div style={{ fontSize: '10px', fontWeight: 800 }}>ROUTINE</div>
                </button>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Emergency Scenario
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select 
                  value={selectedMockId} 
                  onChange={handleMockSelect}
                  className="glass-card"
                  style={{
                    width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)',
                    fontSize: '13px', color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontWeight: 600
                  }}
                >
                  <option value="">{t('select_scenario')}</option>
                  {mockEmergencies.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </section>

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

            {/* Dispatch Button (Sticky on mobile) */}
            <div className="panel-sticky-footer">
              <button onClick={handleDispatch} style={{
                width: '100%', padding: '14px', 
                background: navigating ? 'var(--success)' : 'var(--primary)', 
                color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', 
                fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.3s'
              }}>
                <Navigation size={18} />
                {navigating ? (missionStage === 'to_patient' ? t('en_route_patient') : t('transporting_hospital')) : t('start_dispatch')}
              </button>
            </div>

            {/* Advanced Telemetry Accordion */}
            {navigating && (
              <div style={{ marginTop: '16px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <button 
                  onClick={() => setShowTelemetry(!showTelemetry)}
                  style={{
                    width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)',
                    borderBottom: showTelemetry ? '1px solid var(--border)' : 'none',
                    borderRadius: showTelemetry ? 'var(--radius-sm) var(--radius-sm) 0 0' : 'var(--radius-sm)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} />
                    <span>Advanced Telemetry</span>
                  </div>
                  <span>{showTelemetry ? '▲' : '▼'}</span>
                </button>
                
                {showTelemetry && (
                  <div style={{ padding: '16px', border: '1px solid var(--border)', borderTop: 'none', borderBottomLeftRadius: 'var(--radius-sm)', borderBottomRightRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
                    
                    {/* Priority Score */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        {t('priority_score')}
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '36px', fontWeight: 700, color: 'var(--primary)' }}>
                          {score}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {t('route_safety_score')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                        <div style={{ flex: score, height: '6px', background: 'var(--primary)', borderRadius: '3px' }} />
                        <div style={{ flex: 100 - score, height: '6px', background: 'var(--surface-alt)', borderRadius: '3px' }} />
                      </div>
                    </div>

                    {/* Terrain Risk Analysis */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        {t('terrain_risk_analysis')}
                      </div>
                      {[
                        { label: t('landslide_risk'), pct: landslideRisk, level: landslideRisk > 70 ? 'High' : landslideRisk > 40 ? 'Medium' : 'Low', color: landslideRisk > 70 ? 'var(--critical)' : landslideRisk > 40 ? 'var(--warning)' : 'var(--success)' },
                        { label: t('fog_density'), pct: fogRisk, level: fogRisk > 70 ? 'High' : fogRisk > 40 ? 'Medium' : 'Low', color: fogRisk > 70 ? 'var(--critical)' : fogRisk > 40 ? 'var(--warning)' : 'var(--success)' },
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
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        {t('elevation_profile')}
                      </div>
                      <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', gap: '2px', position: 'relative' }}>
                        {elevationData.map((e: number, i: number) => {
                          const pct = ((e - minElev) / elevRange) * 100;
                          const height = 10 + pct * 0.5;
                          const isCurrent = i === currentSegIdx;
                          const barColor = isCurrent ? 'var(--primary)' : `hsl(${pct > 70 ? 0 : pct > 40 ? 35 : 200}, 70%, 55%)`;
                          return (
                            <div
                              key={i}
                              title={`${Math.round(e)}m elevation`}
                              style={{
                                flex: 1, borderRadius: '2px 2px 0 0', minHeight: '4px', height: `${height}px`,
                                background: barColor, opacity: isCurrent ? 1 : 0.6,
                                boxShadow: isCurrent ? '0 0 10px var(--primary)' : 'none',
                                transition: 'all 0.3s', position: 'relative'
                              }}
                            >
                              {isCurrent && (
                                <div style={{
                                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                                  fontSize: '8px', fontWeight: 900, color: 'var(--primary)'
                                }}>▼</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Start</span><span>Mid</span><span>Dest</span>
                      </div>
                    </div>

                    {/* Live Conditions */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {t('live_conditions')}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                          { label: 'Temp', val: `${liveTemp}°C` },
                          { label: 'Vis', val: `${liveVisibility.toFixed(1)} km` },
                          { label: 'Wind', val: `${liveWind} km/h` },
                          { label: 'Rain', val: liveRain },
                        ].map(s => (
                          <div key={s.label} style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Live Demo Mode Redirection */}
            <section style={{ 
              padding: '24px', background: 'var(--primary)', 
              borderRadius: 'var(--radius-lg)', border: 'none',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
              marginTop: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                  <Activity size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Live Demo Mode
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>
                    Multi-Role Ecosystem
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setActiveRole('patient')}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                  background: 'white', color: 'var(--primary)',
                  fontSize: '13px', fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)', transition: 'all 0.2s'
                }}>
                🚀 LAUNCH FULL LIVE DEMO
              </button>

              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.4 }}>
                Experience real-time SOS tracking between Patients, Drivers, and Hospitals.
              </div>
            </section>
          </div>
        )}

        {/* HOSPITALS TAB */}
        {activeTab === 'hospitals' && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {t('live_bed_availability')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hospitalData.map(h => (
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
