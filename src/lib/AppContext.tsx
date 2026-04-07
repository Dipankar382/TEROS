'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { hospitals as initialHospitals, type Hospital } from '@/lib/mockData';
import { translations, type Language, type TranslationKey } from './translations';
import { rtdb, isFirebaseConfigured } from './firebase';
import { ref, onValue, update, off, DatabaseReference } from 'firebase/database';

type NotificationType = 'info' | 'success' | 'warning' | 'danger';

type AppState = {
  patientType: 'critical' | 'normal';
  setPatientType: (t: 'critical' | 'normal') => void;
  patientSeverity: 'high' | 'medium' | 'low';
  setPatientSeverity: (s: 'high' | 'medium' | 'low') => void;
  patientCondition: 'stable' | 'deteriorating' | 'critical';
  setPatientCondition: (c: 'stable' | 'deteriorating' | 'critical') => void;
  missionStage: 'idle' | 'to_patient' | 'to_hospital';
  heartRate: number;
  setHeartRate: (v: number) => void;
  spo2: number;
  setSpo2: (v: number) => void;
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
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  emitSync: (type: string, payload: Record<string, unknown>) => void;
  firebaseConnected: boolean;
  userId: string;
};

export type FleetAmbulance = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'available' | 'busy';
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
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  const [activeRole, setActiveRole] = useState<'simulation' | 'patient' | 'driver' | 'hospital' | 'admin'>('simulation');
  const activeRoleRef = useRef(activeRole);
  const [sosStatus, setSosStatus] = useState<'idle' | 'requested' | 'dispatched' | 'picked_up' | 'delivered'>('idle');
  const [activeAmbulanceId, setActiveAmbulanceId] = useState<string | null>(null);
  const [ambulances, setAmbulances] = useState<FleetAmbulance[]>([]);
  const isRemoteUpdate = useRef(false);
  const lastWriteTime = useRef(0);
  const [userId] = useState(() => `user_${Math.floor(Math.random() * 10000)}`);

  const [score] = useState(92);
  const [elevationData] = useState<number[]>([350, 365, 380, 395, 410, 420, 408, 395, 375, 360, 355, 368, 385, 400, 412, 403, 385, 370, 358, 350]);
  const currentSegIdx = Math.min(Math.floor(ambulanceProgress * elevationData.length), elevationData.length - 1);
  const [toPatientPath, setToPatientPath] = useState<number[][] | null>(null);
  const [toHospitalPath, setToHospitalPath] = useState<number[][] | null>(null);
  const [previewRoutes, setPreviewRoutes] = useState<Array<{ id: string; path: number[][] }>>([]);
  const [previewSelectedId, setPreviewSelectedId] = useState<string | null>(null);
  const [terrain, setTerrain] = useState(false);
  const [weatherLayer, setWeatherLayer] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const t = useCallback((key: TranslationKey) => {
    return translations[language][key] || key;
  }, [language]);

  const [notification, setNotification] = useState<{ title: string; message: string; type: NotificationType } | null>(null);

  const showNotification = useCallback((title: string, message: string, type: NotificationType = 'info') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const [liveTemp] = useState(18);
  const [liveWind] = useState(12);
  const [liveVisibility] = useState(8);
  const [liveRain] = useState('0mm');
  const [offlineMode, setOfflineMode] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [hospitalData, setHospitalData] = useState<Hospital[]>(initialHospitals);
  const [ambulanceSpeed, setAmbulanceSpeed] = useState(0);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [routeSwitchModalOpen, setRouteSwitchModalOpen] = useState(false);
  const [currentObstacle, setCurrentObstacle] = useState<string | null>(null);

  // Keep activeRoleRef in sync
  useEffect(() => {
    activeRoleRef.current = activeRole;
  }, [activeRole]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FIREBASE REALTIME DATABASE — Sync Engine
  // Replaces previous C++ WebSocket server
  // ─────────────────────────────────────────────────────────────────────────────

  // Helper: write to Firebase with throttle (min 500ms between writes)
  const firebaseWrite = useCallback((path: string, data: Record<string, unknown>) => {
    if (!isFirebaseConfigured || !rtdb) return; // Demo mode — skip Firebase writes
    const now = Date.now();
    if (now - lastWriteTime.current < 500) return;
    lastWriteTime.current = now;
    try {
      update(ref(rtdb, path), data);
    } catch (err) {
      console.warn('[Firebase] write failed:', err);
    }
  }, []);

  // emitSync — drop-in replacement for old WebSocket emitSync
  const emitSync = useCallback((type: string, payload: Record<string, unknown>) => {
    const path = `liveState/${type.toLowerCase()}`;
    firebaseWrite(path, { ...payload, _ts: Date.now() });
  }, [firebaseWrite]);

  // Subscribe to Firebase real-time state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isFirebaseConfigured || !rtdb) {
      console.info('[AppContext] Firebase not configured — running in local demo mode.');
      return; // Skip all Firebase subscriptions in demo mode
    }

    const listeners: { dbRef: DatabaseReference; handler: (snap: { exists: () => boolean; val: () => unknown }) => void }[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface FirebaseData {
      status?: 'idle' | 'requested' | 'dispatched' | 'picked_up' | 'delivered';
      activeAmbulanceId?: string;
      selectedHospital?: string;
      goldenHour?: number;
      criticalEventActive?: boolean;
      latitude?: number;
      longitude?: number;
      condition?: 'stable' | 'deteriorating' | 'critical';
      driver_id?: string;
      speed?: number;
      terrain?: boolean;
      weatherLayer?: boolean;
      trafficLayer?: boolean;
      ambulances?: FleetAmbulance[];
      hospitals?: Hospital[];
      state?: string;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscribe = (path: string, handler: (data: FirebaseData) => void) => {
      const dbRef = ref(rtdb, path);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listener = (snap: { exists: () => boolean; val: () => any }) => {
        if (snap.exists()) handler(snap.val() as FirebaseData);
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onValue(dbRef, listener as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listeners.push({ dbRef, handler: listener as any });
    };

    // Connection state
    const connRef = ref(rtdb, '.info/connected');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connHandler = (snap: { val: () => any }) => {
      const connected = snap.val();
      setFirebaseConnected(!!connected);
      if (connected) {
        showNotification('Firebase Connected', 'Real-time sync active via Firebase.', 'success');
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onValue(connRef, connHandler as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listeners.push({ dbRef: connRef, handler: connHandler as any });

    // Fleet (ambulances)
    subscribe('liveState/fleet', (data: FirebaseData) => {
      if (Array.isArray(data.ambulances)) {
        isRemoteUpdate.current = true;
        setAmbulances(data.ambulances);
        setTimeout(() => { isRemoteUpdate.current = false; }, 50);
      }
    });

    // SOS status
    subscribe('liveState/sos_status', (data) => {
      isRemoteUpdate.current = true;
      if (data.status) setSosStatus(data.status as 'idle' | 'requested' | 'dispatched' | 'picked_up' | 'delivered');
      if (data.activeAmbulanceId !== undefined) setActiveAmbulanceId(data.activeAmbulanceId as string | null);
      if (data.selectedHospital) setSelectedHospital(data.selectedHospital as string);
      if (data.goldenHour != null) setGoldenHour(data.goldenHour as number);
      if (data.criticalEventActive != null) setCriticalEventActive(!!data.criticalEventActive);
      setTimeout(() => { isRemoteUpdate.current = false; }, 50);
    });

    // Emergency coordinates
    subscribe('liveState/sos_request', (data) => {
      if (data.latitude != null && data.longitude != null) {
        isRemoteUpdate.current = true;
        setEmergencyCoords([data.latitude as number, data.longitude as number]);
        setSosStatus('requested');
        if (data.condition) setPatientCondition(data.condition as 'stable' | 'deteriorating' | 'critical');
        if (activeRoleRef.current === 'hospital' || activeRoleRef.current === 'admin') {
          showNotification('🚨 SOS ALERT', `Incoming ${data.condition || 'Critical'} Emergency!`, 'danger');
        }
        setTimeout(() => { isRemoteUpdate.current = false; }, 50);
      }
    });

    // Driver telemetry
    subscribe('liveState/driver_telemetry', (data) => {
      if (data.latitude != null && data.longitude != null) {
        isRemoteUpdate.current = true;
        const coords: [number, number] = [data.latitude, data.longitude];
        if (activeRoleRef.current !== 'driver') {
          setDriverCoords(coords);
        }
        setAmbulances(prev => Array.isArray(prev)
          ? prev.map(a => a.id === data.driver_id ? { ...a, lat: data.latitude ?? a.lat, lng: data.longitude ?? a.lng } : a)
          : []);
        if (data.speed != null) setAmbulanceSpeed(data.speed);
        setTimeout(() => { isRemoteUpdate.current = false; }, 50);
      }
    });

    // Map layers
    subscribe('liveState/map_layers', (data) => {
      isRemoteUpdate.current = true;
      if (data.terrain != null) setTerrain(!!data.terrain);
      if (data.weatherLayer != null) setWeatherLayer(!!data.weatherLayer);
      if (data.trafficLayer != null) setTrafficLayer(!!data.trafficLayer);
      setTimeout(() => { isRemoteUpdate.current = false; }, 50);
    });

    // Hospital data
    subscribe('liveState/hospital_data', (data: FirebaseData) => {
      if (Array.isArray(data.hospitals)) {
        isRemoteUpdate.current = true;
        setHospitalData(data.hospitals);
        setTimeout(() => { isRemoteUpdate.current = false; }, 50);
      }
    });

    // Trip state
    subscribe('liveState/trip_state', (data) => {
      isRemoteUpdate.current = true;
      if (data.state === 'ARRIVED_AT_PATIENT') {
        setMissionStage('to_hospital');
      } else if (data.state === 'EN_ROUTE_TO_HOSPITAL') {
        setMissionStage('to_hospital');
      } else if (data.state === 'COMPLETED') {
        setNavigating(false);
        setMissionStage('idle');
        setSosStatus('idle');
        setEmergencyCoords(null);
        setActiveAmbulanceId(null);
        setAmbulances(prev => Array.isArray(prev) ? prev.map(a => ({ ...a, status: 'available' as const })) : []);
      }
      setTimeout(() => { isRemoteUpdate.current = false; }, 50);
    });

    // State Transition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribe('liveState/state_transition', (data: any) => {
      isRemoteUpdate.current = true;
      if (data.new_state === 'ARRIVED_AT_PATIENT') {
        setMissionStage('to_hospital');
      } else if (data.new_state === 'EN_ROUTE_TO_HOSPITAL') {
        setMissionStage('to_hospital');
      } else if (data.new_state === 'COMPLETED') {
        setNavigating(false);
        setMissionStage('idle');
        setSosStatus('idle');
        setEmergencyCoords(null);
        setActiveAmbulanceId(null);
        setAmbulances(prev => Array.isArray(prev) ? prev.map(a => ({ ...a, status: 'available' as const })) : []);
      }
      setTimeout(() => { isRemoteUpdate.current = false; }, 50);
    });

    // Accept SOS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribe('liveState/accept_sos', (data: any) => {
      isRemoteUpdate.current = true;
      if (data.driver_id) {
        setAmbulances(prev => Array.isArray(prev) ? prev.map(a => a.id === data.driver_id ? { ...a, status: 'busy' } : a) : []);
        setActiveAmbulanceId(data.driver_id as string);
        setSosStatus('dispatched');
      }
      setTimeout(() => { isRemoteUpdate.current = false; }, 50);
    });

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listeners.forEach(({ dbRef, handler }) => off(dbRef, 'value', handler as any));
    };
  }, [showNotification]);

  // ─────────────────────────────────────────────────────────────────────────────
  // OUTGOING: Push state changes to Firebase
  // ─────────────────────────────────────────────────────────────────────────────

  // Outgoing: Driver Telemetry (throttled via firebaseWrite)
  useEffect(() => {
    if ((activeRole === 'driver' || activeRole === 'admin' || activeRole === 'simulation') && driverCoords) {
      firebaseWrite('liveState/driver_telemetry', {
        latitude: driverCoords[0],
        longitude: driverCoords[1],
        speed: ambulanceSpeed || 40,
        elevation: elevationData[currentSegIdx] || 0,
        driver_id: `driver_${activeRole}`,
        _ts: Date.now()
      });
    }
  }, [driverCoords, activeRole, ambulanceSpeed, elevationData, currentSegIdx, firebaseWrite]);

  // Outgoing: SOS status
  useEffect(() => {
    if (sosStatus !== 'idle' && !isRemoteUpdate.current) {
      const authoritativeRoles = ['admin', 'patient', 'driver'];
      if (authoritativeRoles.includes(activeRole)) {
        firebaseWrite('liveState/sos_status', {
          status: sosStatus,
          activeAmbulanceId,
          selectedHospital,
          goldenHour,
          criticalEventActive,
          _ts: Date.now()
        });
      }
    }
  }, [sosStatus, activeAmbulanceId, selectedHospital, activeRole, goldenHour, criticalEventActive, firebaseWrite]);

  // Outgoing: Map layer toggles
  useEffect(() => {
    if ((activeRole === 'admin' || activeRole === 'simulation') && !isRemoteUpdate.current) {
      firebaseWrite('liveState/map_layers', { terrain, weatherLayer, trafficLayer, _ts: Date.now() });
    }
  }, [terrain, weatherLayer, trafficLayer, activeRole, firebaseWrite]);

  // Outgoing: Hospital data updates
  useEffect(() => {
    if ((activeRole === 'hospital' || activeRole === 'admin') && !isRemoteUpdate.current) {
      firebaseWrite('liveState/hospital_data', { hospitals: hospitalData, _ts: Date.now() });
    }
  }, [hospitalData, activeRole, firebaseWrite]);

  // ─────────────────────────────────────────────────────────────────────────────
  // EXISTING BUSINESS LOGIC (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────

  // High-Risk Mountain Scenarios
  useEffect(() => {
    if (activeRole === 'simulation') {
      const timer = setTimeout(() => {
        setCurrentObstacle('Landslide detected near Bhagirathipuram Highland Route');
        showNotification('HAZARD ALERT', 'Landslide blockage on mountain route. Calculating bypass...', 'danger');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeRole, showNotification]);

  const mockEmergencies = [
    { id: 'e1', name: 'Trauma Case #1', lat: 30.0864, lng: 78.2676, description: 'Multiple collision near AIIMS gate.', severity: 'high' as const },
    { id: 'e2', name: 'Cardiac Arrest', lat: 30.0750, lng: 78.2900, description: 'Elderly patient collapsed at home.', severity: 'high' as const },
  ];

  const resetGoldenHour = useCallback(() => setGoldenHour(3600), []);

  const startCriticalEvent = useCallback((severity: 'high' | 'medium' = 'medium') => {
    setCriticalEventActive(true);
    setGoldenHour(severity === 'high' ? 1800 : 2700);
    setPatientCondition('deteriorating');
    showNotification('CRITICAL UPDATE', `Patient vitals are ${severity === 'high' ? 'crashing' : 'unstable'}!`, 'danger');
  }, [showNotification]);

  const stopGoldenHour = useCallback(() => setGoldenHour(0), []);

  // Update golden hour based on patient condition
  useEffect(() => {
    if (sosStatus === 'idle') {
      const target = patientCondition === 'critical' ? 3600 
                   : patientCondition === 'deteriorating' ? 7200 
                   : 10800;
      if (goldenHour !== target) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGoldenHour(target);
      }
    }
  }, [patientCondition, sosStatus, goldenHour]);

  // Golden Hour countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if ((sosStatus === 'dispatched' || sosStatus === 'picked_up') && goldenHour > 0 && !paused) {
      timer = setInterval(() => {
        setGoldenHour(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [sosStatus, paused, goldenHour]);

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
    if (!silent) showNotification('Optimal Routing', `Nearest available trauma center: ${hospitalData.find(h => h.id === best)?.name}`, 'info');
    return best;
  }, [hospitalData, calculateDistance, showNotification]);

  const triggerSOS = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setEmergencyCoords(coords);
          setSosStatus('requested');
          // Write SOS to Firebase
          try {
            update(ref(rtdb, 'liveState/sos_request'), {
              latitude: coords[0],
              longitude: coords[1],
              condition: patientCondition,
              _ts: Date.now()
            });
          } catch (e) { console.warn('[Firebase] SOS write failed:', e); }
          showNotification('SOS BROADCASTED', 'Searching for nearest available ambulance...', 'danger');
        },
        (err) => {
          console.warn('GPS Error, using mock location:', err);
          const mockCoords: [number, number] = [30.0668, 78.2973];
          setEmergencyCoords(mockCoords);
          setSosStatus('requested');
          try {
            update(ref(rtdb, 'liveState/sos_request'), {
              latitude: mockCoords[0],
              longitude: mockCoords[1],
              condition: patientCondition,
              _ts: Date.now()
            });
          } catch (e) { console.warn('[Firebase] SOS write failed:', e); }
          showNotification('SOS (MOCK GPS)', 'Broadcasted from emergency coordinates.', 'danger');
        }
      );
    }
  }, [showNotification, patientCondition]);

  // Automated Allocation Service
  useEffect(() => {
    if (sosStatus === 'requested' && emergencyCoords && activeAmbulanceId === null) {
      const timer = setTimeout(() => {
        let nearestId: string | null = null;
        let minDistance = Infinity;
        const liveDrivers = ambulances.filter(a => a.status === 'available');
        liveDrivers.forEach(amb => {
          const dist = calculateDistance(emergencyCoords, [amb.lat, amb.lng]);
          if (dist < minDistance) { minDistance = dist; nearestId = amb.id; }
        });
        if (nearestId) {
          const targetId = nearestId;
          setAmbulances(prev => Array.isArray(prev) ? prev.map(a => a.id === targetId ? { ...a, status: 'busy' } : a) : []);
          setActiveAmbulanceId(targetId);
          setSosStatus('dispatched');
          showNotification('Ambulance Allocated', `Unit ${targetId} has been dispatched.`, 'success');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sosStatus, emergencyCoords, activeAmbulanceId, ambulances, calculateDistance, showNotification]);

  // Continuous GPS Tracking
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    let watchId: number | null = null;

    if (activeRole === 'driver' && isLiveGPS) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setDriverCoords(coords);
          setAmbulances(prev => Array.isArray(prev) ? prev.map(a =>
            a.id === (activeAmbulanceId || 'amb1') ? { ...a, lat: coords[0], lng: coords[1] } : a
          ) : []);
        },
        (err) => {
          if (err.code === 1) {
            showNotification('GPS Access Required', 'Please enable location permissions for live tracking.', 'warning');
            setIsLiveGPS(false);
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    } else if (activeRole === 'patient' && sosStatus !== 'idle') {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setEmergencyCoords(coords);
          if (isFirebaseConfigured && rtdb) {
            try {
              update(ref(rtdb, 'liveState/sos_request'), { latitude: coords[0], longitude: coords[1], _ts: Date.now() });
            } catch { /* silent */ }
          }
        },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err) => {
          if (err.code === 1) showNotification('GPS Access', 'Please enable location to track your position.', 'warning');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [activeRole, isLiveGPS, sosStatus, activeAmbulanceId, showNotification, setIsLiveGPS]);

  return (
    <AppContext.Provider value={{
      patientType, setPatientType,
      patientSeverity, setPatientSeverity,
      patientCondition, setPatientCondition,
      heartRate, setHeartRate,
      spo2, setSpo2,
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
      hospitalData, setHospitalData,
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
      isSidebarOpen, setIsSidebarOpen,
      emitSync,
      firebaseConnected,
      userId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
