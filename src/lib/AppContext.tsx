'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { hospitals as initialHospitals, type Hospital } from '@/lib/mockData';
import { translations, type Language, type TranslationKey } from './translations';

type NotificationType = 'info' | 'success' | 'warning' | 'danger';

type SyncData = {
  type: string;
  payload: any; // We use any here as it's a generic relay, but specific handlers cast it
};

type AppState = {
  patientType: 'critical' | 'normal';
  setPatientType: (t: 'critical' | 'normal') => void;
  patientSeverity: 'high' | 'medium' | 'low';
  setPatientSeverity: (s: 'high' | 'medium' | 'low') => void;
  patientCondition: 'stable' | 'deteriorating' | 'critical';
  setPatientCondition: (c: 'stable' | 'deteriorating' | 'critical') => void;
  missionStage: 'idle' | 'to_patient' | 'to_hospital';
  heartRate: number;
  spo2: number;
  setMissionStage: (s: 'idle' | 'to_patient' | 'to_hospital') => void;
  activeRole: 'simulation' | 'patient' | 'driver' | 'hospital' | 'admin';
  setActiveRole: (r: 'simulation' | 'patient' | 'driver' | 'hospital' | 'admin') => void;
  sosStatus: 'idle' | 'requested' | 'dispatched' | 'picked_up' | 'delivered';
  setSosStatus: (s: 'idle' | 'requested' | 'dispatched' | 'picked_up' | 'delivered') => void;
  ambulances: Array<{ id: string; name: string; lat: number; lng: number; status: 'available' | 'busy' }>;
  setAmbulances: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string; lat: number; lng: number; status: 'available' | 'busy' }>>>;
  activeAmbulanceId: string | null;
  setActiveAmbulanceId: (id: string | null) => void;
  isLiveGPS: boolean;
  setIsLiveGPS: (v: boolean) => void;
  driverCoords: [number, number] | null;
  setDriverCoords: (coords: [number, number] | null) => void;
  goldenHour: number;
  resetGoldenHour: () => void;
  criticalEventActive: boolean;
  startCriticalEvent: (severity?: 'high' | 'medium') => void;
  selectedHospital: string;
  setSelectedHospital: (id: string) => void;
  navigating: boolean;
  setNavigating: (v: boolean) => void;
  paused: boolean;
  setPaused: (v: boolean) => void;
  currentRouteIdx: number;
  setCurrentRouteIdx: React.Dispatch<React.SetStateAction<number>>;
  ambulanceProgress: number;
  setAmbulanceProgress: React.Dispatch<React.SetStateAction<number>>;
  liveTemp: number;
  liveWind: number;
  liveVisibility: number;
  liveRain: string;
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  sosActive: boolean;
  setSosActive: (v: boolean) => void;
  hospitalData: Hospital[];
  setHospitalData: React.Dispatch<React.SetStateAction<Hospital[]>>;
  ambulanceSpeed: number;
  setAmbulanceSpeed: (s: number) => void;
  simSpeedMultiplier: number;
  setSimSpeedMultiplier: (m: number) => void;
  emergencyCoords: [number, number] | null;
  setEmergencyCoords: (coords: [number, number] | null) => void;
  mockEmergencies: Array<{ id: string; name: string; lat: number; lng: number; description: string; severity?: 'high' | 'medium' }>;
  notification: { title: string; message: string; type: NotificationType } | null;
  showNotification: (title: string, message: string, type?: NotificationType) => void;
  emergencyModalOpen: boolean;
  setEmergencyModalOpen: (v: boolean) => void;
  routeSwitchModalOpen: boolean;
  setRouteSwitchModalOpen: (v: boolean) => void;
  currentObstacle: string | null;
  setCurrentObstacle: (v: string | null) => void;
  findOptimalHospital: (coords: [number, number], silent?: boolean) => string;
  triggerSOS: () => void;
  stopGoldenHour: () => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
  manualHospitalSelection: boolean;
  setManualHospitalSelection: (v: boolean) => void;
  toPatientPath: number[][] | null;
  setToPatientPath: React.Dispatch<React.SetStateAction<number[][] | null>>;
  toHospitalPath: number[][] | null;
  setToHospitalPath: React.Dispatch<React.SetStateAction<number[][] | null>>;
  previewRoutes: Array<{ id: string; path: number[][] }>;
  setPreviewRoutes: (routes: Array<{ id: string; path: number[][] }>) => void;
  previewSelectedId: string | null;
  setPreviewSelectedId: (id: string | null) => void;
  score: number;
  elevationData: number[];
  currentSegIdx: number;
  calculateDistance: (p1: [number, number], p2: [number, number]) => number;
  terrain: boolean;
  setTerrain: (v: boolean) => void;
  weatherLayer: boolean;
  setWeatherLayer: (v: boolean) => void;
  trafficLayer: boolean;
  setTrafficLayer: (v: boolean) => void;
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [manualHospitalSelection, setManualHospitalSelection] = useState(false);
  const [patientType, setPatientType] = useState<'critical' | 'normal'>('critical');
  const [patientCondition, setPatientCondition] = useState<'stable' | 'deteriorating' | 'critical'>('critical');
  const [patientSeverity, setPatientSeverity] = useState<'high' | 'medium' | 'low'>('medium');
  const [heartRate, setHeartRate] = useState(82);
  const [spo2, setSpo2] = useState(98);
  const vitalsRef = useRef({ spo2: 98, heartRate: 82 });

  useEffect(() => {
    vitalsRef.current = { spo2, heartRate };
  }, [spo2, heartRate]);

  const [missionStage, setMissionStage] = useState<'idle' | 'to_patient' | 'to_hospital'>('idle');
  const [goldenHour, setGoldenHour] = useState(3600);
  const [criticalEventActive, setCriticalEventActive] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState('aiims_rishikesh');
  const [navigating, setNavigating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentRouteIdx, setCurrentRouteIdx] = useState(0);
  const [ambulanceProgress, setAmbulanceProgress] = useState(0);
  const [emergencyCoords, setEmergencyCoords] = useState<[number, number] | null>(null);
  const [isLiveGPS, setIsLiveGPS] = useState(false);
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null);
  
  // Real-time Sync Reference (Socket.io)
  const syncSocket = useRef<Socket | null>(null);

  const [activeRole, setActiveRole] = useState<'simulation' | 'patient' | 'driver' | 'hospital' | 'admin'>('simulation');
  const [sosStatus, setSosStatus] = useState<'idle' | 'requested' | 'dispatched' | 'picked_up' | 'delivered'>('idle');
  const [ambulances, setAmbulances] = useState<Array<{ id: string; name: string; lat: number; lng: number; status: 'available' | 'busy' }>>([
    { id: 'amb1', name: 'Ambulance 01', lat: 30.0687, lng: 78.2950, status: 'available' },
    { id: 'amb2', name: 'Ambulance 02', lat: 30.3165, lng: 78.0322, status: 'available' },
    { id: 'amb3', name: 'Ambulance 03', lat: 30.1200, lng: 78.2500, status: 'available' },
  ]);
  const [activeAmbulanceId, setActiveAmbulanceId] = useState<string | null>(null);
  
  // New Mission Telemetry State
  const [score, setScore] = useState(92);
  const [elevationData, setElevationData] = useState<number[]>([350, 365, 380, 395, 410, 420, 408, 395, 375, 360, 355, 368, 385, 400, 412, 403, 385, 370, 358, 350]);
  const currentSegIdx = Math.min(Math.floor(ambulanceProgress * elevationData.length), elevationData.length - 1);
  const [toPatientPath, setToPatientPath] = useState<number[][] | null>(null);
  const [toHospitalPath, setToHospitalPath] = useState<number[][] | null>(null);
  const [previewRoutes, setPreviewRoutes] = useState<Array<{ id: string; path: number[][] }>>([]);
  const [previewSelectedId, setPreviewSelectedId] = useState<string | null>(null);
  const [terrain, setTerrain] = useState(false);
  const [weatherLayer, setWeatherLayer] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState(false);

  const t = useCallback((key: TranslationKey) => {
    return translations[language][key] || key;
  }, [language]);

  const [notification, setNotification] = useState<{ title: string; message: string; type: NotificationType } | null>(null);

  const showNotification = useCallback((title: string, message: string, type: NotificationType = 'info') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const [liveTemp, setLiveTemp] = useState(18);
  const [liveWind, setLiveWind] = useState(12);
  const [liveVisibility, setLiveVisibility] = useState(8);
  const [liveRain, setLiveRain] = useState('0mm');
  const [offlineMode, setOfflineMode] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [hospitalData, setHospitalData] = useState<Hospital[]>(initialHospitals);
  const [ambulanceSpeed, setAmbulanceSpeed] = useState(0);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [routeSwitchModalOpen, setRouteSwitchModalOpen] = useState(false);
  const [currentObstacle, setCurrentObstacle] = useState<string | null>(null);

  const mockEmergencies = [
    { id: 'e1', name: 'Trauma Case #1', lat: 30.0864, lng: 78.2676, description: 'Multiple collision near AIIMS gate.', severity: 'high' as const },
    { id: 'e2', name: 'Cardiac Arrest', lat: 30.0750, lng: 78.2900, description: 'Elderly patient collapsed at home.', severity: 'high' as const },
  ];

  const resetGoldenHour = useCallback(() => setGoldenHour(3600), []);
  const startCriticalEvent = useCallback((severity: 'high' | 'medium' = 'medium') => {
    setCriticalEventActive(true);
    setPatientCondition('deteriorating');
    showNotification('CRITICAL UPDATE', `Patient vitals are ${severity === 'high' ? 'crashing' : 'unstable'}!`, 'danger');
  }, [showNotification]);

  const stopGoldenHour = useCallback(() => setGoldenHour(0), []);

  const calculateDistance = useCallback((p1: [number, number], p2: [number, number]) => {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  }, []);

  const findOptimalHospital = useCallback((coords: [number, number], silent = false) => {
    let best = 'aiims_rishikesh';
    let minDist = Infinity;
    hospitalData.forEach(h => {
      const d = calculateDistance(coords, [h.lat, h.lng]);
      const available = h.beds.general.available + h.beds.icu.available + h.beds.emergency.available + h.beds.ventilator.available;
      if (d < minDist && available > 0) {
        minDist = d;
        best = h.id;
      }
    });
    if (!silent) showNotification('Optimal Routing', `Nearest available trauma center: ${hospitalData.find(h=>h.id===best)?.name}`, 'info');
    return best;
  }, [hospitalData, calculateDistance, showNotification]);

  const triggerSOS = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setEmergencyCoords(coords);
          setSosStatus('requested');
          showNotification('SOS BROADCASTED', 'Searching for nearest available ambulance...', 'danger');
        },
        (err) => {
          console.warn('GPS Error, using mock location:', err);
          const mockCoords: [number, number] = [30.0668, 78.2973];
          setEmergencyCoords(mockCoords);
          setSosStatus('requested');
          showNotification('SOS (MOCK GPS)', 'Broadcasted from emergency coordinates.', 'danger');
        }
      );
    }
  }, [showNotification]);

  // Automated Allocation Service
  useEffect(() => {
    if (sosStatus === 'requested' && emergencyCoords && activeAmbulanceId === null) {
      let nearestId: string | null = null;
      let minDistance = Infinity;
      
      ambulances.forEach(amb => {
        if (amb.status === 'available') {
          const dist = calculateDistance(emergencyCoords, [amb.lat, amb.lng]);
          if (dist < minDistance) {
            minDistance = dist;
            nearestId = amb.id;
          }
        }
      });

      if (nearestId) {
        const targetId = nearestId;
        // Wrapping updates to ensure they happen together and correctly
        setAmbulances(prev => prev.map(a => a.id === targetId ? { ...a, status: 'busy' } : a));
        setActiveAmbulanceId(targetId);
        setSosStatus('dispatched');
        showNotification('Ambulance Allocated', `Unit ${targetId} has been dispatched to your location.`, 'success');
      }
    }
  }, [sosStatus, emergencyCoords, activeAmbulanceId, ambulances, calculateDistance, showNotification]);

  // Continuous GPS Tracking (Driver & Patient)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    
    let watchId: number | null = null;

    if (activeRole === 'driver' && isLiveGPS) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setDriverCoords(coords);
          setAmbulances(prev => prev.map(a => 
            a.id === (activeAmbulanceId || 'amb1') ? { ...a, lat: coords[0], lng: coords[1] } : a
          ));
        },
        (err) => {
          if (err.code === 1) {
            showNotification('GPS Access Required', 'Please enable location permissions for live tracking.', 'warning');
          } else if (err.code !== 3) {
            showNotification('GPS Status', 'Live location unavailable. Switching to simulation.', 'warning');
          }
          setIsLiveGPS(false);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    } else if (activeRole === 'patient' && sosStatus !== 'idle') {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setEmergencyCoords(coords);
        },
        (err) => console.error('Patient GPS Error:', err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    }

    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [activeRole, isLiveGPS, sosStatus, activeAmbulanceId, showNotification, setIsLiveGPS]);

  // Helper to emit events to the relay server
  const emitSync = useCallback((type: string, payload: unknown) => {
    syncSocket.current?.emit('teros_sync', { type, payload });
  }, []);

  // Synchronization and Real-time Broadcasting Logic (Socket.io for Cross-Device Support)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';
    syncSocket.current = io(socketUrl);
    
    syncSocket.current.on('connect', () => {
      console.log('Connected to Teros Sync Server');
      showNotification('Sync Connected', 'Real-time cross-device link active.', 'success');
    });

    syncSocket.current.on('teros_sync', (data: SyncData) => {
      const { type, payload } = data;
      switch (type) {
        case 'UPDATE_DRIVER_LOCATION':
          setAmbulances(prev => prev.map(a => a.id === payload.id ? { ...a, lat: payload.lat, lng: payload.lng } : a));
          if (!isLiveGPS && activeAmbulanceId === payload.id) setDriverCoords([payload.lat, payload.lng]);
          break;
        case 'UPDATE_EMERGENCY_COORDS':
          setEmergencyCoords(payload);
          break;
        case 'UPDATE_SOS_STATUS':
          setSosStatus(payload.status);
          if (payload.activeAmbulanceId) setActiveAmbulanceId(payload.activeAmbulanceId);
          if (payload.selectedHospital) setSelectedHospital(payload.selectedHospital);
          
          if (payload.status === 'dispatched') {
            setNavigating(true);
            setMissionStage('to_patient');
          } else if (payload.status === 'picked_up') {
            setMissionStage('to_hospital');
          } else if (payload.status === 'idle' || payload.status === 'delivered') {
            setNavigating(false);
            setMissionStage('idle');
            setEmergencyCoords(null);
            setDriverCoords(null);
          }
          break;
        case 'UPDATE_HOSPITAL_DATA':
          setHospitalData(payload);
          break;
        case 'UPDATE_MAP_LAYERS':
          setTerrain(payload.terrain);
          setWeatherLayer(payload.weatherLayer);
          setTrafficLayer(payload.trafficLayer);
          break;
      }
    });

    return () => {
      syncSocket.current?.disconnect();
    };
  }, [isLiveGPS, activeAmbulanceId, showNotification]);

  // Outgoing Emitters
  useEffect(() => {
    if (activeRole === 'driver' && driverCoords) {
      emitSync('UPDATE_DRIVER_LOCATION', { id: activeAmbulanceId || 'amb1', lat: driverCoords[0], lng: driverCoords[1] });
    }
  }, [driverCoords, activeRole, activeAmbulanceId, emitSync]);

  useEffect(() => {
    if (activeRole === 'patient' && emergencyCoords) {
      emitSync('UPDATE_EMERGENCY_COORDS', emergencyCoords);
    }
  }, [emergencyCoords, activeRole, emitSync]);

  useEffect(() => {
    emitSync('UPDATE_SOS_STATUS', { status: sosStatus, activeAmbulanceId, selectedHospital });
  }, [sosStatus, activeAmbulanceId, selectedHospital, emitSync]);

  useEffect(() => {
    if (activeRole === 'admin' || activeRole === 'simulation') {
      emitSync('UPDATE_MAP_LAYERS', { terrain, weatherLayer, trafficLayer });
    }
  }, [terrain, weatherLayer, trafficLayer, activeRole, emitSync]);

  useEffect(() => {
    if (activeRole === 'hospital' || activeRole === 'admin') {
      emitSync('UPDATE_HOSPITAL_DATA', hospitalData);
    }
  }, [hospitalData, activeRole, emitSync]);

  return (
    <AppContext.Provider value={{
      patientType, setPatientType,
      patientSeverity, setPatientSeverity,
      patientCondition, setPatientCondition,
      heartRate, spo2,
      missionStage, setMissionStage,
      goldenHour, resetGoldenHour,
      criticalEventActive, startCriticalEvent,
      selectedHospital, setSelectedHospital,
      navigating, setNavigating,
      paused, setPaused,
      currentRouteIdx, setCurrentRouteIdx,
      ambulanceProgress, setAmbulanceProgress,
      emergencyCoords, setEmergencyCoords,
      mockEmergencies,
      liveTemp, liveWind, liveVisibility, liveRain,
      offlineMode, setOfflineMode,
      sosActive, setSosActive,
      hospitalData,
      setHospitalData,
      ambulanceSpeed, setAmbulanceSpeed,
      simSpeedMultiplier, setSimSpeedMultiplier,
      notification, showNotification,
      emergencyModalOpen, setEmergencyModalOpen,
      routeSwitchModalOpen, setRouteSwitchModalOpen,
      currentObstacle, setCurrentObstacle,
      findOptimalHospital,
      triggerSOS,
      stopGoldenHour,
      language, setLanguage,
      t,
      manualHospitalSelection, setManualHospitalSelection,
      toPatientPath, setToPatientPath,
      toHospitalPath, setToHospitalPath,
      previewRoutes, setPreviewRoutes,
      previewSelectedId, setPreviewSelectedId,
      isLiveGPS, setIsLiveGPS,
      driverCoords, setDriverCoords,
      activeRole, setActiveRole,
      sosStatus, setSosStatus,
      ambulances, setAmbulances,
      activeAmbulanceId, setActiveAmbulanceId,
      score,
      elevationData,
      currentSegIdx,
      calculateDistance,
      terrain, setTerrain,
      weatherLayer, setWeatherLayer,
      trafficLayer, setTrafficLayer,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
