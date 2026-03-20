'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  activeTripId: string | null;
  setActiveTripId: (id: string | null) => void;
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
  emitSync: (type: string, payload: any) => void;
  userId: string;
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

  // Real-time Sync Reference (Native WebSocket to C++ backend)
  const syncSocket = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef(`user_${Math.floor(Math.random() * 10000)}`);

  const [activeRole, setActiveRole] = useState<'simulation' | 'patient' | 'driver' | 'hospital' | 'admin'>('simulation');
  const activeRoleRef = useRef(activeRole);
  const [sosStatus, setSosStatus] = useState<'idle' | 'requested' | 'dispatched' | 'picked_up' | 'delivered'>('idle');
  const [activeAmbulanceId, setActiveAmbulanceId] = useState<string | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [assignedDriverId, setAssignedDriverId] = useState<string | null>(null);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const isRemoteUpdate = useRef(false);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
  
  // High-Risk Mountain Scenarios: Tehri/THDC Landslide
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

  // Update golden hour whenever condition changes
  useEffect(() => {
    if (sosStatus === 'idle') {
      if (patientCondition === 'critical') setGoldenHour(3600); // 60 mins
      else if (patientCondition === 'deteriorating') setGoldenHour(7200); // 120 mins
      else setGoldenHour(10800); // 180 mins
    }
  }, [patientCondition, sosStatus]);

  // Golden Hour countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if ((sosStatus === 'dispatched' || sosStatus === 'picked_up') && goldenHour > 0 && !paused) {
      timer = setInterval(() => {
        setGoldenHour(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [sosStatus, paused]); // Remove goldenHour from deps to prevent interval thrashing

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
          emitSync('SOS_REQUEST', { 
            latitude: coords[0], 
            longitude: coords[1],
            condition: patientCondition
          });
          showNotification('SOS BROADCASTED', 'Searching for nearest available ambulance...', 'danger');
        },
        (err) => {
          console.warn('GPS Error, using mock location:', err);
          const mockCoords: [number, number] = [30.0668, 78.2973];
          setEmergencyCoords(mockCoords);
          setSosStatus('requested');
          emitSync('SOS_REQUEST', { 
            latitude: mockCoords[0], 
            longitude: mockCoords[1],
            condition: patientCondition 
          });
          showNotification('SOS (MOCK GPS)', 'Broadcasted from emergency coordinates.', 'danger');
        }
      );
    }
  }, [showNotification]);

  // Automated Allocation Service
  useEffect(() => {
    if (sosStatus === 'requested' && emergencyCoords && activeAmbulanceId === null) {
      const timer = setTimeout(() => {
        let nearestId: string | null = null;
        let minDistance = Infinity;

        const liveDrivers = ambulances.filter(a => a.status === 'available');

        liveDrivers.forEach(amb => {
          const dist = calculateDistance(emergencyCoords, [amb.lat, amb.lng]);
          if (dist < minDistance) {
            minDistance = dist;
            nearestId = amb.id;
          }
        });

        if (nearestId) {
          const targetId = nearestId;
          setAmbulances(prev => Array.isArray(prev) ? prev.map(a => a.id === targetId ? { ...a, status: 'busy' } : a) : []);
          setActiveAmbulanceId(targetId);
          setSosStatus('dispatched');
          showNotification('Ambulance Allocated', `Unit ${targetId} has been dispatched automatically.`, 'success');
        }
      }, 1000); // Reduce to 1s for "INSTANT" feeling in live demo
      return () => clearTimeout(timer);
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
          setAmbulances(prev => Array.isArray(prev) ? prev.map(a =>
            a.id === (activeAmbulanceId || 'amb1') ? { ...a, lat: coords[0], lng: coords[1] } : a
          ) : []);
        },
        (err) => {
          if (err.code === 1) {
            showNotification('GPS Access Required', 'Please enable location permissions for live tracking.', 'warning');
            setIsLiveGPS(false);
          } else {
            console.warn('GPS Error inside watchPosition:', err);
            // Don't set fallback coordinates to maintain ACCURACY
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    } else if (activeRole === 'patient' && sosStatus !== 'idle') {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setEmergencyCoords(coords);
          // Sync with server immediately
          emitSync('UPDATE_EMERGENCY_COORDS', { latitude: coords[0], longitude: coords[1] });
        },
        (err) => {
          if (err.code === 1) {
            showNotification('GPS Access', 'Please enable location to track your position.', 'warning');
          } else {
             console.warn('Patient GPS Error, falling back.', err);
             // Stay at previous or null to avoid inaccurate jumps
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [activeRole, isLiveGPS, sosStatus, activeAmbulanceId, showNotification, setIsLiveGPS]);

  // Helper to emit events to the C++ Live Server
  const emitSync = useCallback((type: string, payload: any) => {
    if (syncSocket.current && syncSocket.current.readyState === WebSocket.OPEN) {
      syncSocket.current.send(JSON.stringify({ type, ...payload }));
    }
  }, []);

  // Keep activeRoleRef in sync
  useEffect(() => {
    activeRoleRef.current = activeRole;
  }, [activeRole]);

  // Re-send AUTH when role changes (but only if socket is already open)
  useEffect(() => {
    if (syncSocket.current && syncSocket.current.readyState === WebSocket.OPEN) {
      let roleEnum = 'UNKNOWN';
      if (activeRole === 'admin') roleEnum = 'ADMIN';
      else if (activeRole === 'hospital') roleEnum = 'HOSPITAL';
      else if (activeRole === 'patient') roleEnum = 'PATIENT';
      else if (activeRole === 'driver') roleEnum = 'DRIVER';
      syncSocket.current.send(JSON.stringify({ type: 'AUTH', id: userIdRef.current, role: roleEnum }));
    }
  }, [activeRole]);

  useEffect(() => {
    const heartbeat = setInterval(() => {
      emitSync('HEARTBEAT', {});
    }, 15000);
    return () => clearInterval(heartbeat);
  }, [emitSync]);

  // STABLE WebSocket connection — deps are empty so it never reconnects on state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function connect() {
      const socketUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL || 'ws://localhost:9001';
      const ws = new WebSocket(socketUrl);
      syncSocket.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected to C++ Teros Sync Server');
        showNotification('Sync Connected', 'Real-time WebSocket link active.', 'success');

        // Send AUTH with current role
        let roleEnum = 'UNKNOWN';
        const role = activeRoleRef.current;
        if (role === 'admin') roleEnum = 'ADMIN';
        else if (role === 'hospital') roleEnum = 'HOSPITAL';
        else if (role === 'patient') roleEnum = 'PATIENT';
        else if (role === 'driver') roleEnum = 'DRIVER';
        ws.send(JSON.stringify({ type: 'AUTH', id: userIdRef.current, role: roleEnum }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type } = data;

          switch (type) {
            case 'AUTH_SUCCESS':
              console.log(`[WS] Authenticated as ${data.role}. ${data.connectedClients} clients online.`);
              if (Array.isArray(data.activeDrivers)) {
                setAmbulances(data.activeDrivers);
              }
              if (Array.isArray(data.activeTrips) && data.activeTrips.length > 0) {
                const trip = data.activeTrips[0]; // Sync first active trip for demo
                const authoritativeRoles = ['admin', 'hospital', 'driver'];
                if (authoritativeRoles.includes(activeRoleRef.current)) {
                  isRemoteUpdate.current = true;
                  setActiveTripId(trip.trip_id);
                  if (trip.patient_lat && trip.patient_lng) {
                    setEmergencyCoords([trip.patient_lat, trip.patient_lng]);
                  }
                  if (trip.condition) setPatientCondition(trip.condition);
                  // Map TripState enum back to string status
                  const stateMap: Record<number, any> = {
                    1: 'dispatched',
                    2: 'picked_up',
                    3: 'delivered',
                    0: 'idle'
                  };
                  if (stateMap[trip.state]) setSosStatus(stateMap[trip.state]);
                  setTimeout(() => { isRemoteUpdate.current = false; }, 50);
                }
              }
              break;

            case 'USER_JOINED':
              console.log(`[WS] ${data.role} joined: ${data.id}`);
              if (data.role === 'PATIENT') {
                showNotification('Patient Connected', 'A patient device has joined the network.', 'info');
              } else if (data.role === 'DRIVER') {
                showNotification('Driver Connected', 'An ambulance driver has joined the network.', 'info');
                setAmbulances(prev => {
                  const safePrev = Array.isArray(prev) ? prev : [];
                  if (safePrev.find(a => a.id === data.id)) return safePrev;
                  // Don't set hardcoded lat/lng here, wait for TELEMETRY_UPDATE
                  return [...safePrev, { id: data.id, name: `Live Unit ${data.id.slice(-4)}`, lat: 0, lng: 0, status: 'available' }];
                });
              }
              break;

            case 'SOS_ALERT':
              if (data.latitude != null && data.longitude != null) {
                isRemoteUpdate.current = true;
                setEmergencyCoords([data.latitude, data.longitude]);
                setSosStatus('requested');
                setPatientCondition(data.condition || 'critical');
                setActiveTripId(data.trip_id);
                // If I am a patient, I also want to track this trip's assigned resource
                if (activeRoleRef.current === 'patient') {
                  setActiveAmbulanceId(data.trip_id);
                }
                showNotification('🚨 SOS ALERT', `Incoming ${data.condition || 'Critical'} Emergency Request!`, 'danger');
                if (activeRoleRef.current === 'driver') {
                  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate([500, 200, 500, 200, 500]);
                  }
                }
                setTimeout(() => { isRemoteUpdate.current = false; }, 50);
              }
              break;

            case 'EMERGENCY_COORDS_UPDATE':
              if (data.coords && data.coords.latitude != null && data.coords.longitude != null) {
                isRemoteUpdate.current = true;
                setEmergencyCoords([data.coords.latitude, data.coords.longitude]);
                setTimeout(() => { isRemoteUpdate.current = false; }, 50);
              }
              break;

            case 'SOS_ASSIGNED':
              isRemoteUpdate.current = true;
              setSosStatus('dispatched');
              setActiveTripId(data.trip_id);
              setAssignedDriverId(data.driver_id);
              if (activeRoleRef.current === 'patient') {
                setActiveAmbulanceId(data.driver_id);
                showNotification('SOS Accepted', 'A live ambulance is en route!', 'success');
              }
              setTimeout(() => { isRemoteUpdate.current = false; }, 50);
              break;

            case 'FLEET_UPDATE':
              isRemoteUpdate.current = true;
              if (Array.isArray(data.ambulances)) {
                setAmbulances(data.ambulances);
              } else {
                console.warn('[WS] FLEET_UPDATE received non-array ambulances:', data.ambulances);
              }
              setTimeout(() => { isRemoteUpdate.current = false; }, 50);
              break;

            case 'TELEMETRY_UPDATE':
              if (data.latitude != null && data.longitude != null) {
                isRemoteUpdate.current = true;
                setAmbulances(prev => Array.isArray(prev) 
                  ? prev.map(a => a.id === data.driver_id ? { ...a, lat: data.latitude, lng: data.longitude } : a)
                  : []
                );
                
                // If I am the patient and this is my allocated driver, update local view
                if (data.driver_id === activeAmbulanceId || data.driver_id === assignedDriverId || data.driver_id === userIdRef.current) {
                  setDriverCoords([data.latitude, data.longitude]);
                }
                if (data.speed != null) setAmbulanceSpeed(data.speed);
                setTimeout(() => { isRemoteUpdate.current = false; }, 50);
              }
              break;

            case 'TRIP_STATE_UPDATE': {
              const { new_state } = data;
              isRemoteUpdate.current = true;
              if (new_state === 'ARRIVED_AT_PATIENT') {
                setMissionStage('to_hospital');
                if (emergencyCoords) findOptimalHospital(emergencyCoords);
              } else if (new_state === 'EN_ROUTE_TO_HOSPITAL') {
                setMissionStage('to_hospital');
              } else if (new_state === 'COMPLETED') {
                setNavigating(false);
                setMissionStage('idle');
                setSosStatus('idle');
                setEmergencyCoords(null);
                setActiveTripId(null);
                if (activeRoleRef.current === 'patient') {
                  setActiveAmbulanceId(null);
                }
                setAmbulances(prev => Array.isArray(prev) ? prev.map(a => ({ ...a, status: 'available' })) : []);
              }
              setTimeout(() => { isRemoteUpdate.current = false; }, 50);
              break;
            }

            case 'SOS_STATUS_UPDATE':
              if (sosStatus !== data.status || activeAmbulanceId !== data.activeAmbulanceId || selectedHospital !== data.selectedHospital) {
                isRemoteUpdate.current = true;
                setSosStatus(data.status);
                if (data.activeAmbulanceId) setActiveAmbulanceId(data.activeAmbulanceId);
                if (data.selectedHospital) setSelectedHospital(data.selectedHospital);
                if (data.goldenHour != null) setGoldenHour(data.goldenHour);
                if (data.criticalEventActive != null) setCriticalEventActive(data.criticalEventActive);
                setTimeout(() => { isRemoteUpdate.current = false; }, 50);
              }
              break;

            case 'MAP_LAYERS_UPDATE':
              isRemoteUpdate.current = true;
              setTerrain(data.terrain);
              setWeatherLayer(data.weatherLayer);
              setTrafficLayer(data.trafficLayer);
              setTimeout(() => { isRemoteUpdate.current = false; }, 50);
              break;

            case 'HOSPITAL_DATA_UPDATE':
              isRemoteUpdate.current = true;
              setHospitalData(data.hospitalData);
              setTimeout(() => { isRemoteUpdate.current = false; }, 50);
              break;
          }
        } catch (err) {
          console.error('[WS] Failed to process message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected. Reconnecting in 3s...');
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close(); // triggers onclose → auto-reconnect
      };
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      syncSocket.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = stable connection, never reconnects on state changes

  // Outgoing: Driver Telemetry with 500ms throttle
  const lastTelemetryTime = useRef(0);
  useEffect(() => {
    if ((activeRole === 'driver' || activeRole === 'admin' || activeRole === 'simulation') && driverCoords) {
      const now = Date.now();
      if (now - lastTelemetryTime.current > 500) {
        lastTelemetryTime.current = now;
        emitSync('DRIVER_TELEMETRY', { latitude: driverCoords[0], longitude: driverCoords[1], speed: ambulanceSpeed || 40, elevation: elevationData[currentSegIdx] || 0 });
      }
    }
  }, [driverCoords, activeRole, ambulanceSpeed, elevationData, currentSegIdx, emitSync]);

  // Outgoing: Patient emergency coords
  useEffect(() => {
    if (activeRole === 'patient' && emergencyCoords) {
      emitSync('UPDATE_EMERGENCY_COORDS', { latitude: emergencyCoords[0], longitude: emergencyCoords[1] });
    }
  }, [emergencyCoords, activeRole, emitSync]);

  // Outgoing: SOS status changes
  useEffect(() => {
    if (sosStatus !== 'idle' && !isRemoteUpdate.current) {
        // Only allow certain roles to push status updates to prevent loops
        const authoritativeRoles = ['admin', 'patient', 'driver'];
        if (authoritativeRoles.includes(activeRole)) {
            emitSync('UPDATE_SOS_STATUS', { status: sosStatus, activeAmbulanceId, selectedHospital, goldenHour, criticalEventActive });
        }
    }
  }, [sosStatus, activeAmbulanceId, selectedHospital, activeRole, emitSync]);

  // Outgoing: Map layer toggles
  useEffect(() => {
    if (activeRole === 'admin' || activeRole === 'simulation') {
      emitSync('UPDATE_MAP_LAYERS', { terrain, weatherLayer, trafficLayer });
    }
  }, [terrain, weatherLayer, trafficLayer, activeRole, emitSync]);

  // Outgoing: Hospital data updates 
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
      activeTripId, setActiveTripId,
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
      userId: userIdRef.current
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
