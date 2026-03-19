'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '@/lib/AppContext';

// Fixed starting point
const ambulanceStation: [number, number] = [30.1200, 78.2500];

// Helper to handle map bounds
function MapBoundsController({ routeParams }: { routeParams: number[][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (routeParams && routeParams.length > 0) {
      const bounds = L.latLngBounds(routeParams as L.LatLngExpression[]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [routeParams, map]);
  return null;
}

// Helper to center on ambulance if requested
function CenterOnAmbulance({ trigger, markerRef }: { trigger: number, markerRef: React.RefObject<L.Marker | null> }) {
  const map = useMap();
  useEffect(() => {
    if (markerRef.current) {
      map.setView(markerRef.current.getLatLng(), 15);
    }
  }, [trigger, markerRef, map]);
  return null;
}

export default function MapComponent() {
  const { 
    navigating, paused, setNavigating, 
    selectedHospital, ambulanceProgress, setAmbulanceProgress, offlineMode,
    showNotification, missionStage, setMissionStage,
    emergencyCoords, hospitalData, simSpeedMultiplier, setAmbulanceSpeed,
    findOptimalHospital, stopGoldenHour
  } = useApp();
  
  const [toPatientPath, setToPatientPath] = useState<number[][] | null>(null);
  const [toHospitalPath, setToHospitalPath] = useState<number[][] | null>(null);
  const [terrain, setTerrain] = useState(false);
  const [weatherLayer, setWeatherLayer] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState(false);
  const [centerTrigger, setCenterTrigger] = useState(0);

  const ambulanceRef = useRef<L.Marker>(null);
  const animFrame = useRef<number>(0);
  const progressRef = useRef(0);

  // Determine active path
  const currentActivePath = useMemo(() => {
    if (missionStage === 'to_patient') return toPatientPath;
    if (missionStage === 'to_hospital') return toHospitalPath;
    return null;
  }, [missionStage, toPatientPath, toHospitalPath]);

  // Sync ref with state for animation loop
  useEffect(() => {
    progressRef.current = ambulanceProgress;
  }, [ambulanceProgress]);

  // Reset paths when not navigating
  useEffect(() => {
    if (!navigating && missionStage === 'idle') {
      setToPatientPath(null);
      setToHospitalPath(null);
      setAmbulanceSpeed(0);
    }
  }, [navigating, missionStage, setAmbulanceSpeed]);

  // Fetch Stage 1: Station to Emergency
  useEffect(() => {
    if (emergencyCoords) {
      console.log("Fetching Stage 1 Path...", emergencyCoords);
      const start = ambulanceStation;
      const end = emergencyCoords;
      fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 'Ok' && data.routes?.[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            setToPatientPath(coords);
            console.log("Stage 1 Path Set:", coords.length, "points");
          } else {
            console.error("OSRM Stage 1 Error:", data);
            showNotification('Navigation Error', 'Could not find road path to incident site.', 'danger');
          }
        })
        .catch(err => console.error("Stage 1 Fetch Exception:", err));
    }
  }, [emergencyCoords, showNotification]);

  // Fetch Stage 2: Emergency to Hospital
  useEffect(() => {
    if (emergencyCoords && selectedHospital) {
      const hospital = hospitalData.find(h => h.id === selectedHospital);
      if (hospital) {
        console.log("Fetching Stage 2 Path...", hospital.name);
        const start = emergencyCoords;
        const end: [number, number] = [hospital.lat, hospital.lng];
        fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.code === 'Ok' && data.routes?.[0]) {
              const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
              setToHospitalPath(coords);
              console.log("Stage 2 Path Set:", coords.length, "points");
            } else {
              console.error("OSRM Stage 2 Error:", data);
              showNotification('Navigation Error', 'Could not find road path to hospital.', 'danger');
            }
          })
          .catch(err => console.error("Stage 2 Fetch Exception:", err));
      }
    }
  }, [emergencyCoords, selectedHospital, hospitalData, showNotification]);

  // Simulation Loop
  useEffect(() => {
    if (!navigating || paused || !currentActivePath || currentActivePath.length < 2) {
      if (animFrame.current) {
        cancelAnimationFrame(animFrame.current);
        animFrame.current = 0;
      }
      return;
    }

    let lastTime = performance.now();
    
    // Calculate total path distance for speed scaling
    let totalPathDistKm = 0;
    for (let i = 0; i < currentActivePath.length - 1; i++) {
      const p1 = currentActivePath[i];
      const p2 = currentActivePath[i + 1];
      const dLat = (p2[0] - p1[0]) * 111.32;
      const dLng = (p2[1] - p1[1]) * 96.44; // Approximation at 30N
      totalPathDistKm += Math.sqrt(dLat * dLat + dLng * dLng);
    }

    const animate = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;
      
      if (deltaMs <= 0) {
        animFrame.current = requestAnimationFrame(animate);
        return;
      }

      // Base simulation speed: cover the distance at ~60km/h naturally, 
      // then scale by simSpeedMultiplier.
      const baseSpeedKmH = 60;
      const speedKmMs = (baseSpeedKmH * simSpeedMultiplier) / 3600000;
      const distanceMovedKm = speedKmMs * deltaMs;
      const progressDelta = distanceMovedKm / (totalPathDistKm || 0.1);
      
      progressRef.current += progressDelta;
      
      if (progressRef.current >= 1) {
        progressRef.current = 1;
        setAmbulanceProgress(1);
        setAmbulanceSpeed(0);
        
        if (missionStage === 'to_patient') {
          // RE-EVALUATE BEST HOSPITAL UPON ARRIVAL
          const arrivalCoords = currentActivePath[currentActivePath.length - 1];
          const bestId = findOptimalHospital(arrivalCoords as [number, number], false); // false to allow notification
          const bestHospital = hospitalData.find(h => h.id === bestId);
          
          showNotification('Arrival & Stabilization', `Reached site. AI Redirecting to ${bestHospital?.name || 'nearest hospital'}...`, 'warning');

          setTimeout(() => {
            setMissionStage('to_hospital');
            setAmbulanceProgress(0);
            progressRef.current = 0;
          }, 3000); // 3 seconds for stabilization and dispatcher awareness
        } else {
          setNavigating(false);
          setMissionStage('idle');
          stopGoldenHour(); // STOP TIMER AT HOSPITAL
          showNotification('Arrival Successful', 'Patient handed over to ED. Golden Hour stabilized.', 'success');
        }
        return;
      }
      
      setAmbulanceProgress(progressRef.current);

      if (ambulanceRef.current && currentActivePath.length >= 2) {
        const path = currentActivePath;
        const totalSegments = path.length - 1;
        const progressInPath = progressRef.current * totalSegments;
        const segIdx = Math.min(Math.floor(progressInPath), totalSegments - 1);
        const segProgress = progressInPath - segIdx;

        const lat = path[segIdx][0] + (path[segIdx + 1][0] - path[segIdx][0]) * segProgress;
        const lng = path[segIdx][1] + (path[segIdx + 1][1] - path[segIdx][1]) * segProgress;

        ambulanceRef.current.setLatLng([lat, lng] as L.LatLngExpression);
        
        // Jittery speed effect for realism
        const jitter = (Math.random() - 0.5) * 4;
        setAmbulanceSpeed(Math.round(baseSpeedKmH + jitter));
      }

      animFrame.current = requestAnimationFrame(animate);
    };

    animFrame.current = requestAnimationFrame(animate);
    
    return () => {
      if (animFrame.current) {
        cancelAnimationFrame(animFrame.current);
        animFrame.current = 0;
      }
    };
  }, [navigating, paused, currentActivePath, missionStage, setNavigating, setAmbulanceProgress, setMissionStage, showNotification, simSpeedMultiplier, setAmbulanceSpeed]);

  const tileUrl = offlineMode 
    ? "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
    : terrain 
      ? "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const hospitalIcon = L.divIcon({
    html: `<div style="width:34px;height:34px;background:#fff;border:2px solid #DC3545;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.25);font-size:18px;">🏥</div>`,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const emergencyIcon = L.divIcon({
    html: `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:32px;filter:drop-shadow(0 0 8px rgba(255,0,0,0.6));animation:pulseScale 1s infinite alternate;">🚨</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const ambulanceIcon = L.divIcon({
    html: `
      <div style="width:48px;height:48px;position:relative;">
        <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid #2563EB;animation:pulseGlow 1.5s infinite;opacity:0.8;"></div>
        <div style="width:48px;height:48px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="white" style="width:26px;height:26px;"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H15V3H9v2H6.5c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
        </div>
      </div>
    `,
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });

  const handleToggleWeather = () => {
    setWeatherLayer(!weatherLayer);
    if (!weatherLayer) {
      showNotification('Weather Overlay', 'Severe weather zones highlighted on map.', 'warning');
    }
  };

  const handleToggleTraffic = () => {
    setTrafficLayer(!trafficLayer);
  };

  const ctrlBtnStyle = (active: boolean): React.CSSProperties => ({
    width: '36px', height: '36px', borderRadius: '6px',
    background: active ? 'var(--primary)' : 'var(--surface-solid)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border-strong)'}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '14px',
    color: active ? '#fff' : 'var(--text)',
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map Overlay Controls */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px', right: '16px',
        zIndex: 1000, display: 'flex', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'var(--surface-solid)', borderRadius: '10px', padding: '10px 14px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '8px',
          width: '300px', border: '1px solid var(--border-strong)',
          pointerEvents: 'auto',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B92A0" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search location on map..." 
            style={{
              border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'inherit',
              flex: 1, color: 'var(--text)', background: 'transparent',
            }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
          <button onClick={() => setTerrain(!terrain)} style={ctrlBtnStyle(terrain)} title="Terrain View">⛰️</button>
          <button onClick={handleToggleWeather} style={ctrlBtnStyle(weatherLayer)} title="Weather Overlay">🌧️</button>
          <button onClick={handleToggleTraffic} style={ctrlBtnStyle(trafficLayer)} title="Traffic">🚗</button>
          <button onClick={() => setCenterTrigger(c => c + 1)} style={ctrlBtnStyle(false)} title="Center Ambulance">🎯</button>
        </div>
      </div>

      <MapContainer 
        center={ambulanceStation as L.LatLngExpression} 
        zoom={13} 
        zoomControl={false}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        <TileLayer attribution='&copy; OSM' url={tileUrl} />
        
        {toPatientPath && (
          <Polyline
            positions={toPatientPath as L.LatLngExpression[]}
            pathOptions={{ 
              color: '#EF4444', 
              weight: 5, 
              dashArray: missionStage === 'to_patient' ? undefined : '10 10', 
              opacity: missionStage === 'to_patient' ? 1 : 0.6 
            }}
          />
        )}

        {toHospitalPath && (
          <Polyline
            positions={toHospitalPath as L.LatLngExpression[]}
            pathOptions={{ 
              color: '#3B82F6', 
              weight: 6, 
              opacity: missionStage === 'to_hospital' ? 1 : 0.6 
            }}
          />
        )}
        
        {currentActivePath && <MapBoundsController routeParams={currentActivePath} />}
        <CenterOnAmbulance trigger={centerTrigger} markerRef={ambulanceRef} />

        <Marker 
          ref={ambulanceRef} 
          position={ambulanceStation as L.LatLngExpression} 
          icon={ambulanceIcon} 
          zIndexOffset={100} 
        />

        {emergencyCoords && (
          <Marker position={emergencyCoords as L.LatLngExpression} icon={emergencyIcon}>
            <Popup>Emergency Site</Popup>
          </Marker>
        )}

        {hospitalData.map(h => (
          <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
            <Popup>
              <strong>{h.name}</strong><br/>
              ICU: {h.beds.icu.available}/{h.beds.icu.total}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
