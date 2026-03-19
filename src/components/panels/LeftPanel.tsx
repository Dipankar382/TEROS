'use client';

import React, { useState } from 'react';
import { routes, weatherData } from '@/lib/mockData';
import { Navigation, MapPin, ShieldAlert, Activity } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState('dispatch');
  const [hospitalFilter, setHospitalFilter] = useState('');
  
  const {
    patientType, setPatientType,
    missionStage, setMissionStage,
    goldenHour, criticalEventActive, startCriticalEvent,
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
      return;
    }
    setNavigating(true);
    setAmbulanceProgress(0);
    setMissionStage('to_patient');
    setPaused(false);
    showNotification('Dispatch Initiated', 'Ambulance is en route to the patient location.', 'success');
  };



  const handleLocateEmergency = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setEmergencyCoords(coords);
        setPickupLocation(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)} (Current)`);
        startCriticalEvent();
        findOptimalHospital(coords);
        showNotification('Emergency Located', 'Golden hour started. Found optimal route.', 'warning');
      }, () => {
        const coords: [number, number] = [30.0869, 78.2676];
        setEmergencyCoords(coords);
        setPickupLocation(`30.0869, 78.2676 (Emergency Site)`);
        startCriticalEvent();
        findOptimalHospital(coords);
        showNotification('Emergency Mock Located', 'Golden hour started. Found optimal route.', 'warning');
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
        startCriticalEvent();
        findOptimalHospital(coords);
        showNotification('Mission Updated', `Emergency: ${mock.name}. Golden hour active.`, 'danger');
    }
  };

  const hospitalRoutes = routes[selectedHospital] || routes['aiims_rishikesh'];

  const filteredHospitals = hospitalData.filter(h =>
    h.name.toLowerCase().includes(hospitalFilter.toLowerCase())
  );

  return (
    <div className="left-panel" style={{
      width: '340px', minWidth: '340px', background: 'var(--surface)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)', zIndex: 10,
      overflow: 'hidden',
    }}>
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
            {tab}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* DISPATCH TAB */}
        {activeTab === 'dispatch' && (
          <div>
            {/* Patient Classification */}
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Patient Classification
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <button 
                onClick={() => startCriticalEvent()}
                style={{
                  flex: 1, padding: '10px', border: `2px solid ${patientType === 'critical' ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: patientType === 'critical' ? 'var(--danger)' : 'var(--surface)',
                  color: patientType === 'critical' ? '#fff' : 'var(--text)',
                  textAlign: 'center', cursor: 'pointer',
                }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>🚨</div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Critical</div>
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
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Normal</div>
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
                  Golden Hour Remaining {simSpeedMultiplier > 1 && `(${simSpeedMultiplier}x)`}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '32px', fontWeight: 700, color: isCriticalTime ? 'var(--critical)' : 'var(--warning)', letterSpacing: '2px' }}>
                  {formatGH(goldenHour)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Critical window for patient survival
                </div>
              </div>
            )}

            {/* Pickup Location */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Mock Emergencies
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '10px', fontWeight: 700 }}>
                  <ShieldAlert size={12} /> LIVE INCIDENTS
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
                <option value="">Select a scenario...</option>
                {mockEmergencies.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Manual/Current Location
                </label>
                <button onClick={handleLocateEmergency} style={{
                  background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, 
                  display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0
                }}>
                  <MapPin size={12} /> Locate Me
                </button>
              </div>
              <input type="text" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} placeholder="Wait for location or type..." style={{
                width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontSize: '13px', fontFamily: 'inherit', color: 'var(--text)', background: 'var(--surface)', outline: 'none',
              }} />
            </div>

            {/* AI Selected Hospital (Read-only) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Optimal Destination (AI)
                </label>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--success)', background: 'var(--success-light)', padding: '2px 8px', borderRadius: '10px' }}>
                  AUTO-SELECTED
                </div>
              </div>
              <div style={{
                width: '100%', padding: '12px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)',
                fontSize: '14px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>🏥</span>
                {hospitalData.find(h => h.id === selectedHospital)?.name || 'Calculating...'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                AI has selected the nearest facility with available ICU beds.
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
                  Live Mission Telemetry
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      {ambulanceSpeed}
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>KM/H</span>
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Current Velocity
                    </div>
                  </div>
                  
                  <div style={{ width: '1px', height: '30px', background: 'rgba(27,115,232,0.2)' }}></div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                       {missionStage === 'to_patient' ? 'TO SITE' : 'TO HOSPITAL'}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Active Stage
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
                  Sim Speed: {simSpeedMultiplier}x
                </label>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {simSpeedMultiplier === 1 ? 'REAL-TIME' : 'ACCELERATED'}
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
              {navigating ? (missionStage === 'to_patient' ? '● En Route to Patient...' : '● Transporting to Hospital...') : 'Start Dispatch'}
            </button>
          </div>
        )}

        {/* HOSPITALS TAB */}
        {activeTab === 'hospitals' && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Live Bed Availability
            </div>
            <div style={{ marginBottom: '12px' }}>
              <input 
                type="text" 
                placeholder="Search hospitals..." 
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
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: 'var(--text)' }}>{h.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{h.dist} away</div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: h.open ? 'var(--success-light)' : 'var(--critical-light)',
                      color: h.open ? 'var(--success)' : 'var(--critical)',
                    }}>
                      {h.open ? 'Open' : 'Closed'}
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
                    {h.specialties.map(s => (
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
              Regional Weather
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {weatherData.map(w => (
                <div key={w.location} style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{w.icon} {w.location}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{w.condition}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{w.temp}°C</div>
                      {w.severe && (
                        <div style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                          background: 'var(--critical-light)', color: 'var(--critical)',
                          textTransform: 'uppercase', marginTop: '4px', display: 'inline-block',
                        }}>
                          SEVERE
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
