'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, Circle, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '@/lib/AppContext';
import { hospitals, weatherData, routes } from '@/lib/mockData';

// Fixed starting point (ambulance station)
const ambulanceStation: [number, number] = [30.1200, 78.2500];

// Helper to fit map bounds to a route
function MapBoundsController({ routeParams }: { routeParams: number[][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (routeParams && routeParams.length > 1) {
      const bounds = L.latLngBounds(routeParams as L.LatLngExpression[]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [routeParams, map]);
  return null;
}

// Helper to re-center map on ambulance
function CenterOnAmbulance({ trigger, markerRef }: { trigger: number; markerRef: React.RefObject<L.Marker | null> }) {
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
    navigating, paused, setNavigating, setPaused,
    selectedHospital, setSelectedHospital, ambulanceProgress, setAmbulanceProgress, offlineMode,
    showNotification, missionStage, setMissionStage,
    emergencyCoords, hospitalData, simSpeedMultiplier, setAmbulanceSpeed,
    findOptimalHospital, stopGoldenHour,
    t, language, routeSwitchModalOpen, setRouteSwitchModalOpen, patientType,
    currentRouteIdx, setCurrentRouteIdx,
    currentObstacle, setCurrentObstacle,
    toPatientPath, setToPatientPath,
    toHospitalPath, setToHospitalPath,
    previewRoutes, previewSelectedId,
    mockEmergencies
  } = useApp();

  const [terrain, setTerrain] = useState(false);
  const [weatherLayer, setWeatherLayer] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState(false);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [completedPathTrace, setCompletedPathTrace] = useState<[number, number][]>([]);

  const ambulanceRef = useRef<L.Marker>(null);
  const animFrame = useRef<number>(0);
  const progressRef = useRef(0);
  const prevPathRef = useRef<number[][] | null>(null);

  const [trafficSegments, setTrafficSegments] = useState<Array<{ path: [number, number][]; level: number; delay: number }>>([]);

  // Generate and Update "Live" Arterial Traffic Simulation
  useEffect(() => {
    // 1. Extract all road paths from mock data to serve as "arteries"
    const arterialPaths: [number, number][][] = [];
    Object.values(routes).forEach((hospitalRoutes: any) => {
      hospitalRoutes.forEach((r: any) => {
        if (r.path && r.path.length > 0) {
          arterialPaths.push(r.path as [number, number][]);
        }
      });
    });

    const generate = () => {
      const segs: Array<{ path: [number, number][]; level: number; delay: number }> = [];
      
      // 2. Break long paths into shorter segments for more granular traffic display
      arterialPaths.forEach(path => {
        for (let i = 0; i < path.length - 1; i++) {
          const level = Math.random() * 100;
          segs.push({
            path: [path[i], path[i+1]],
            level,
            delay: Math.round((level / 100) * 8) // shorter segments = smaller individual delays
          });
        }
      });
      setTrafficSegments(segs);
    };

    generate();
    const interval = setInterval(() => {
      setTrafficSegments(prev => prev.map(s => {
        // Only flux traffic slightly so it doesn't jump crazily
        const flux = (Math.random() - 0.5) * 15;
        const newLevel = Math.max(0, Math.min(100, s.level + flux));
        return {
          ...s,
          level: newLevel,
          delay: Math.round((newLevel / 100) * 8)
        };
      }));
    }, 12000); // Slower shuffle for road segments

    return () => clearInterval(interval);
  }, []);

  // Memoize static icons to prevent expensive Leaflet re-creations on each render
  const hospitalIcon = useMemo(() => L.divIcon({
    html: '<div style="width:34px;height:34px;background:#fff;border:2px solid #DC3545;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.25);font-size:18px;">🏥</div>',
    className: '', iconSize: [34, 34], iconAnchor: [17, 17],
  }), []);

  const emergencyIcon = useMemo(() => L.divIcon({
    html: '<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:32px;filter:drop-shadow(0 0 8px rgba(255,0,0,0.6));animation:pulseScale 1s infinite alternate;">🚨</div>',
    className: '', iconSize: [40, 40], iconAnchor: [20, 20],
  }), []);

  const ambulanceIcon = useMemo(() => L.divIcon({
    html: `<div style="width:48px;height:48px;position:relative;">
      <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid #2563EB;animation:pulseGlow 1.5s infinite;opacity:0.8;"></div>
      <div style="width:48px;height:48px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
        <svg viewBox="0 0 24 24" fill="white" style="width:26px;height:26px;"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H15V3H9v2H6.5c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
      </div>
    </div>`,
    className: '', iconSize: [48, 48], iconAnchor: [24, 24],
  }), []);

  const weatherIcon = useCallback((icon: string) => L.divIcon({
    html: `<div style="font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${icon}</div>`,
    className: '', iconSize: [30, 30], iconAnchor: [15, 15],
  }), []);

  const trafficIcon = useCallback((color: string) => L.divIcon({
    html: `<div style="width:12px;height:12px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 0 10px ${color};"></div>`,
    className: '', iconSize: [12, 12], iconAnchor: [6, 6],
  }), []);

  // Determine active path for simulation
  const currentActivePath = useMemo(() => {
    if (missionStage === 'to_patient') return toPatientPath;
    if (missionStage === 'to_hospital') return toHospitalPath;
    return null;
  }, [missionStage, toPatientPath, toHospitalPath]);

  // Sync progress ref with state (for animation loop)
  useEffect(() => {
    progressRef.current = ambulanceProgress;
  }, [ambulanceProgress]);

  // Track path switches to maintain a visual history of the route driven so far
  useEffect(() => {
    if (prevPathRef.current && prevPathRef.current !== currentActivePath) {
      if (progressRef.current > 0 && progressRef.current < 1) {
        setCompletedPathTrace(prev => [
          ...prev, 
          ...(prevPathRef.current!.slice(0, Math.ceil(progressRef.current * prevPathRef.current!.length)) as [number, number][])
        ]);
      }
    }
    prevPathRef.current = currentActivePath;
  }, [currentActivePath]);

  // Reset paths when mission ends
  useEffect(() => {
    if (!navigating && missionStage === 'idle') {
      setToPatientPath(null);
      setToHospitalPath(null);
      setAmbulanceSpeed(0);
      setCompletedPathTrace([]);
    }
  }, [navigating, missionStage, setAmbulanceSpeed, setToPatientPath, setToHospitalPath]);

  // Stage 1: Fetch path from ambulance station → emergency scene
  useEffect(() => {
    if (!emergencyCoords) return;
    const [eLat, eLng] = emergencyCoords;
    const [sLat, sLng] = ambulanceStation;
    fetch(`https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes?.[0]) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
          setToPatientPath(coords);
        } else {
          showNotification('Navigation Error', 'Could not find road path to incident site.', 'danger');
        }
      })
      .catch(err => console.error('Stage 1 Fetch Error', err));
  }, [emergencyCoords, showNotification, setToPatientPath]);

  // Stage 2: Fetch path from emergency scene → hospital (only on initial setup, not on reroutes)
  useEffect(() => {
    if (!emergencyCoords || !selectedHospital || toHospitalPath) return;
    const hospitalInfo = hospitals.find(h => h.id === selectedHospital);
    if (!hospitalInfo) return;
    const [eLat, eLng] = emergencyCoords;
    fetch(`https://router.project-osrm.org/route/v1/driving/${eLng},${eLat};${hospitalInfo.lng},${hospitalInfo.lat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes?.[0]) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
          setToHospitalPath(coords);
        }
      })
      .catch(err => console.error('Stage 2 Fetch Error', err));
  }, [emergencyCoords, selectedHospital, toHospitalPath, setToHospitalPath]);

  // Main animation loop
  useEffect(() => {
    if (!navigating || paused || !currentActivePath || currentActivePath.length < 2) {
      if (animFrame.current) {
        cancelAnimationFrame(animFrame.current);
        animFrame.current = 0;
      }
      return;
    }

    let lastTime = performance.now();

    // Compute total path distance for speed calibration
    let totalPathDistKm = 0;
    for (let i = 0; i < currentActivePath.length - 1; i++) {
      const p1 = currentActivePath[i];
      const p2 = currentActivePath[i + 1];
      const dLat = (p2[0] - p1[0]) * 111.32;
      const dLng = (p2[1] - p1[1]) * 96.44;
      totalPathDistKm += Math.sqrt(dLat * dLat + dLng * dLng);
    }

    const baseSpeedKmH = 60;

    const animate = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;

      const speedKmMs = (baseSpeedKmH * simSpeedMultiplier) / 3600000;
      const progressDelta = (speedKmMs * deltaMs) / (totalPathDistKm || 0.1);
      progressRef.current += progressDelta;

      if (progressRef.current >= 1) {
        progressRef.current = 1;
        setAmbulanceProgress(1);
        setAmbulanceSpeed(0);

        if (missionStage === 'to_patient') {
          const arrivalCoords = currentActivePath[currentActivePath.length - 1] as [number, number];
          const bestId = findOptimalHospital(arrivalCoords, false);
          const bestHospital = hospitalData.find(h => h.id === bestId);
          showNotification('Arrived at Scene', `Stabilizing patient. Heading to ${bestHospital?.name || 'hospital'}...`, 'warning');
          setTimeout(() => {
            setMissionStage('to_hospital');
            setAmbulanceProgress(0);
            progressRef.current = 0;
          }, 3000);
        } else {
          setNavigating(false);
          setMissionStage('idle');
          stopGoldenHour();
          showNotification('Mission Complete ✅', 'Patient delivered to hospital successfully.', 'success');
        }
        return;
      }

      setAmbulanceProgress(progressRef.current);

      if (ambulanceRef.current && currentActivePath.length >= 2) {
        const totalSegs = currentActivePath.length - 1;
        const progressInPath = progressRef.current * totalSegs;
        const segIdx = Math.min(Math.floor(progressInPath), totalSegs - 1);
        const seg = progressInPath - segIdx;
        const lat = currentActivePath[segIdx][0] + (currentActivePath[segIdx + 1][0] - currentActivePath[segIdx][0]) * seg;
        const lng = currentActivePath[segIdx][1] + (currentActivePath[segIdx + 1][1] - currentActivePath[segIdx][1]) * seg;
        ambulanceRef.current.setLatLng([lat, lng] as L.LatLngExpression);
        setAmbulanceSpeed(Math.round(baseSpeedKmH + (Math.random() - 0.5) * 5));
      }

      animFrame.current = requestAnimationFrame(animate);
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [navigating, paused, currentActivePath, missionStage, setAmbulanceProgress, setMissionStage, showNotification, simSpeedMultiplier, setAmbulanceSpeed, findOptimalHospital, hospitalData, stopGoldenHour, setNavigating]);

  // Disaster detection & AI auto-rerouting (BOTH Stage 1 and Stage 2)
  useEffect(() => {
    if (!navigating || paused || missionStage === 'idle') return;

    const inTriggerZone = ambulanceProgress > 0.35 && ambulanceProgress < 0.46;
    const disasters = ['Landslide Blocking Road', 'Flash Flood Warning', 'Severe Rockfall', 'Road Washout'];

    // ── Stage 1: To Patient ─────────────────────────────────────────────────
    if (missionStage === 'to_patient' && inTriggerZone && !routeSwitchModalOpen) {
      // Only trigger on terrain-risky emergency scenarios (roughly 40% chance)
      if (Math.random() > 0.6) return;
      const obstacle = disasters[Math.floor(Math.random() * disasters.length)];
      setCurrentObstacle(obstacle);
      setPaused(true);
      setRouteSwitchModalOpen(true);
      showNotification('⚠ ' + t('obstacle_detected'), `${obstacle} en route to casualty site. Select alternative path.`, 'warning');

      // Critical patients: AI auto-fetches OSRM alternative after 10s
      if (patientType === 'critical' && toPatientPath && toPatientPath.length >= 2 && emergencyCoords) {
        const liveMarker = ambulanceRef.current?.getLatLng();
        const segIdx = Math.min(Math.floor(ambulanceProgress * (toPatientPath.length - 1)), toPatientPath.length - 2);
        const fromLat = liveMarker?.lat ?? toPatientPath[segIdx][0];
        const fromLng = liveMarker?.lng ?? toPatientPath[segIdx][1];
        const [eLat, eLng] = emergencyCoords;

        const timer = setTimeout(() => {
          fetch(`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${eLng},${eLat}?overview=full&geometries=geojson&alternatives=true`)
            .then(r => r.json())
            .then(data => {
              // Pick the first alternative if available, else the main route
              const picked = data.routes?.[1] ?? data.routes?.[0];
              if (data.code === 'Ok' && picked) {
                const coords: [number, number][] = picked.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                const path: [number, number][] = [[fromLat, fromLng], ...coords];
                setToPatientPath(path);
                setAmbulanceProgress(0);
                progressRef.current = 0;
                setRouteSwitchModalOpen(false);
                setPaused(false);
                showNotification('🤖 AI Rerouted', 'Alternative road to casualty site selected automatically.', 'success');
              } else {
                setPaused(false);
                setRouteSwitchModalOpen(false);
              }
            })
            .catch(() => { setPaused(false); setRouteSwitchModalOpen(false); });
        }, 10000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // ── Stage 2: To Hospital ─────────────────────────────────────────────────
    if (missionStage === 'to_hospital') {
      const riskyHospitals = ['aiims_rishikesh', 'district_tehri', 'masiha_chamba'];
      const isRisky = riskyHospitals.includes(selectedHospital);

      if (isRisky && inTriggerZone && !routeSwitchModalOpen) {
        const obstacle = disasters[Math.floor(Math.random() * disasters.length)];
        setCurrentObstacle(obstacle);
        setPaused(true);
        setRouteSwitchModalOpen(true);
        showNotification('⚠ ' + t('obstacle_detected'), `${obstacle} on hospital route. Mission paused.`, 'warning');

        if (patientType === 'critical' && toHospitalPath && toHospitalPath.length >= 2) {
          const liveMarker = ambulanceRef.current?.getLatLng();
          const segIdx = Math.min(Math.floor(ambulanceProgress * (toHospitalPath.length - 1)), toHospitalPath.length - 2);
          const fromLat = liveMarker?.lat ?? toHospitalPath[segIdx][0];
          const fromLng = liveMarker?.lng ?? toHospitalPath[segIdx][1];

          const timer = setTimeout(() => {
            const bestHospital = hospitalData
              .filter(h => h.open && h.beds.icu.available > 0 && h.id !== selectedHospital)
              .sort((a, b) => {
                const dA = Math.sqrt((a.lat - fromLat) ** 2 + (a.lng - fromLng) ** 2);
                const dB = Math.sqrt((b.lat - fromLat) ** 2 + (b.lng - fromLng) ** 2);
                return (b.beds.icu.available * 5 - dB * 1000) - (a.beds.icu.available * 5 - dA * 1000);
              })[0];

            if (!bestHospital) { setPaused(false); setRouteSwitchModalOpen(false); return; }

            fetch(`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${bestHospital.lng},${bestHospital.lat}?overview=full&geometries=geojson`)
              .then(r => r.json())
              .then(data => {
                if (data.code === 'Ok' && data.routes?.[0]) {
                  const coords: [number, number][] = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                  setToHospitalPath([[fromLat, fromLng], ...coords]);
                  setAmbulanceProgress(0);
                  progressRef.current = 0;
                  setSelectedHospital(bestHospital.id);
                  setRouteSwitchModalOpen(false);
                  setPaused(false);
                  showNotification('🤖 AI Rerouted', `Auto-redirected to ${bestHospital.name} (${bestHospital.beds.icu.available} ICU beds)`, 'success');
                } else {
                  setPaused(false); setRouteSwitchModalOpen(false);
                }
              })
              .catch(() => { setPaused(false); setRouteSwitchModalOpen(false); });
          }, 10000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [navigating, paused, missionStage, ambulanceProgress, selectedHospital, routeSwitchModalOpen, patientType, t, setRouteSwitchModalOpen, setPaused, setCurrentObstacle, showNotification, hospitalData, toHospitalPath, toPatientPath, setToHospitalPath, setToPatientPath, setAmbulanceProgress, setSelectedHospital, emergencyCoords]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const filteredHospitals = hospitalData.filter(h => 
      h.name.toLowerCase().includes(q.toLowerCase()) || (h.name_hi && h.name_hi.includes(q))
    ).map(h => ({ ...h, type: 'hospital' }));
    
    const filteredEmergencies = mockEmergencies.filter(e => 
      e.name.toLowerCase().includes(q.toLowerCase())
    ).map(e => ({ ...e, type: 'emergency' }));

    setSearchResults([...filteredHospitals, ...filteredEmergencies]);
  };

  const handleSearchResultClick = (item: any) => {
    if (mapInstance) {
      mapInstance.setView([item.lat, item.lng], 16);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const tileUrl = offlineMode
    ? 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
    : terrain
      ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

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
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('search_placeholder')} 
            style={{ border: 'none', outline: 'none', fontSize: '13px', flex: 1, color: 'var(--text)', background: 'transparent' }} 
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '70px', left: '16px', width: '300px',
            background: 'var(--surface-solid)', borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)', padding: '5px 0',
            border: '1px solid var(--border-strong)', zIndex: 1100,
            overflowY: 'auto', maxHeight: '300px', pointerEvents: 'auto'
          }}>
            {searchResults.map(item => (
              <div 
                key={item.id}
                onClick={() => handleSearchResultClick(item)}
                style={{
                  padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '16px' }}>{item.type === 'hospital' ? '🏥' : '⚠️'}</span>
                <span>{language === 'hi' && item.name_hi ? item.name_hi : item.name}</span>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && (
          <div style={{
            position: 'absolute', top: '70px', left: '16px', width: '300px',
            background: 'var(--surface-solid)', borderRadius: '10px', padding: '12px 14px',
            fontSize: '12px', color: 'var(--text-muted)', border: '1px solid var(--border-strong)',
            pointerEvents: 'auto'
          }}>
            {t('no_results')}
          </div>
        )}


        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
          <button onClick={() => setTerrain(!terrain)} style={ctrlBtnStyle(terrain)} title="Terrain View">⛰️</button>
          <button onClick={() => setWeatherLayer(!weatherLayer)} style={ctrlBtnStyle(weatherLayer)} title="Weather Overlay">🌧️</button>
          <button onClick={() => setTrafficLayer(!trafficLayer)} style={ctrlBtnStyle(trafficLayer)} title="Traffic Layer">🚗</button>
          <button onClick={() => setCenterTrigger(c => c + 1)} style={ctrlBtnStyle(false)} title="Center on Ambulance">🎯</button>
        </div>
      </div>

      <MapContainer
        center={ambulanceStation as L.LatLngExpression}
        zoom={13}
        zoomControl={false}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        ref={setMapInstance}
      >
        <TileLayer attribution="&copy; OSM" url={tileUrl} />
        <ZoomControl position="bottomright" />

        {/* Route to patient (red dashed when completed) */}
        {toPatientPath && (
          <Polyline
            positions={toPatientPath as L.LatLngExpression[]}
            pathOptions={{ color: '#EF4444', weight: 5, dashArray: missionStage === 'to_patient' ? undefined : '10 10', opacity: missionStage === 'to_patient' ? 1 : 0.5 }}
          />
        )}

        {/* Route to hospital (blue) */}
        {toHospitalPath && (
          <Polyline
            positions={toHospitalPath as L.LatLngExpression[]}
            pathOptions={{ color: '#3B82F6', weight: 6, opacity: missionStage === 'to_hospital' ? 1 : 0.5 }}
          />
        )}

        {/* Historical driven trace after rerouting */}
        {completedPathTrace.length > 0 && (
          <Polyline
            positions={completedPathTrace as L.LatLngExpression[]}
            pathOptions={{ color: '#A855F7', weight: 6, opacity: 0.8 }}
          />
        )}

        {/* Alternative Route Previews */}
        {previewRoutes.map(pr => {
          const isSelected = pr.id === previewSelectedId;
          return (
            <Polyline
              key={`preview-${pr.id}`}
              positions={pr.path as L.LatLngExpression[]}
              pathOptions={{ 
                color: isSelected ? 'var(--primary)' : '#94a3b8', 
                weight: isSelected ? 8 : 4, 
                opacity: isSelected ? 1 : 0.6,
                dashArray: isSelected ? undefined : '10, 10'
              }}
            />
          );
        })}

        {currentActivePath && <MapBoundsController routeParams={currentActivePath} />}
        <CenterOnAmbulance trigger={centerTrigger} markerRef={ambulanceRef} />

        {/* Ambulance Marker */}
        <Marker ref={ambulanceRef} position={ambulanceStation as L.LatLngExpression} icon={ambulanceIcon} zIndexOffset={100} />

        {/* Emergency Scene */}
        {emergencyCoords && (
          <Marker position={emergencyCoords as L.LatLngExpression} icon={emergencyIcon}>
            <Popup><div style={{ fontWeight: 700 }}>🚨 Emergency Site</div></Popup>
          </Marker>
        )}

        {/* Hospital Markers */}
        {hospitalData.map(h => (
          <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
            <Popup>
              <div style={{ fontWeight: 700 }}>{language === 'hi' ? h.name_hi : h.name}</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>ICU: {h.beds.icu.available}/{h.beds.icu.total} beds</div>
              <div style={{ fontSize: '11px', color: h.open ? 'green' : 'red' }}>{h.open ? '● Open' : '● Closed'}</div>
            </Popup>
          </Marker>
        ))}

        {/* Weather Overlays */}
        {weatherLayer && weatherData.map((w, idx) => (
          <React.Fragment key={`weather-${idx}`}>
            <Circle
              center={[w.lat, w.lng]}
              radius={w.severe ? 3000 : 1500}
              pathOptions={{ fillColor: w.severe ? '#DC3545' : '#1B73E8', fillOpacity: 0.15, color: w.severe ? '#DC3545' : '#1B73E8', weight: 1 }}
            />
            <Marker position={[w.lat, w.lng]} icon={weatherIcon(w.icon)}>
              <Popup>
                <div style={{ fontWeight: 800 }}>{language === 'hi' ? w.location_hi : w.location}</div>
                <div>{language === 'hi' ? w.condition_hi : w.condition} ({w.temp}°C)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Wind: {w.wind} km/h</div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {trafficLayer && trafficSegments.map((seg, idx) => {
          const isHeavy = seg.level > 65;
          const isModerate = seg.level > 30 && seg.level <= 65;
          const color = isHeavy ? '#DC3545' : isModerate ? '#F59E0B' : '#10B981';
          return (
            <Polyline
              key={`traf-${idx}`}
              positions={seg.path as L.LatLngExpression[]}
              pathOptions={{
                color,
                weight: isHeavy ? 6 : isModerate ? 4 : 3,
                opacity: 0.7,
                dashArray: isHeavy ? '4, 10' : undefined,
              }}
            >
              <Popup>
                <div style={{ fontWeight: 800, color }}>
                  {isHeavy ? '🔴 Heavy Congestion' : isModerate ? '🟡 Moderate Traffic' : '🟢 Fluid Traffic'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Traffic Level: {Math.round(seg.level)}%</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>AI predicts {seg.delay} min delay</div>
              </Popup>
            </Polyline>
          );
        })}
      </MapContainer>
    </div>
  );
}

const ctrlBtnStyle = (active: boolean): React.CSSProperties => ({
  width: '40px', height: '40px', borderRadius: '8px',
  background: active ? 'var(--primary)' : 'var(--surface-solid)',
  border: `1px solid ${active ? 'var(--primary)' : 'var(--border-strong)'}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', fontSize: '14px',
  color: active ? '#fff' : 'var(--text)',
});
