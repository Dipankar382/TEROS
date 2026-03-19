'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { hospitals as initialHospitals, routes, type Hospital } from '@/lib/mockData';
import { translations, type Language, type TranslationKey } from './translations';

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
  const syncChannel = useRef<BroadcastChannel | null>(null);

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

  const mockEmergencies: Array<{ id: string; name: string; lat: number; lng: number; description: string; severity?: 'high' | 'medium' }> = [
    { id: 'nh7_landslide', name: 'Landslide on NH-7', lat: 30.1250, lng: 78.3150, description: 'Blocked road near Shivpuri', severity: 'high' },
    { id: 'thdc_spill', name: 'Lab Chemical Spill - THDC IHET', lat: 30.3705, lng: 78.4302, description: 'Inhalation risk at campus lab', severity: 'medium' },
    { id: 'tehri_dam_accident', name: 'Accident - Tehri Dam Viewpoint', lat: 30.3780, lng: 78.4750, description: 'Vehicle fall near dam reservoir', severity: 'high' },
    { id: 'chamba_landslide', name: 'Landslide - Chamba Road', lat: 30.3550, lng: 78.4050, description: 'Major blockage on New Tehri road', severity: 'high' },
    { id: 'city_heart', name: 'Heart Attack - City Center', lat: 30.0869, lng: 78.2676, description: 'Emergency near Laxman Jhula', severity: 'high' },
    { id: 'trekker_injury', name: 'Trekker Injury - Neer Garh', lat: 30.1420, lng: 78.3310, description: 'Falls from height, head injury', severity: 'medium' },
    { id: 'forest_fire_pauri', name: 'Forest Fire - Pauri Ridge', lat: 30.1550, lng: 78.7850, description: 'Multiple burn injuries reported', severity: 'high' },
    { id: 'cloudburst_tehri', name: 'Cloudburst - Upper Tehri', lat: 30.4000, lng: 78.4500, description: 'Structural collapse, survivors trapped', severity: 'high' },
    { id: 'glacial_outflow', name: 'Glacial Outflow - Rishiganga', lat: 30.4850, lng: 79.7400, description: 'Flash flood, hydro-project accident', severity: 'high' },
    { id: 'bridge_collapse', name: 'Bridge Collapse - Srinagar', lat: 30.2250, lng: 78.7880, description: 'Vehicle in river, multiple casualties', severity: 'high' },
    { id: 'high_altitude_edema', name: 'HAPE Case - Kedarnath', lat: 30.7352, lng: 79.0672, description: 'Severe altitude sickness, O2 required', severity: 'high' },
  ];
  
  const [liveTemp, setLiveTemp] = useState(8);
  const [liveWind, setLiveWind] = useState(22);
  const [liveVisibility, setLiveVisibility] = useState(2.1);
  const [liveRain, setLiveRain] = useState('Light');
  const [offlineMode, setOfflineMode] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  
  const [hospitalData, setHospitalData] = useState<Hospital[]>(
    initialHospitals.map(h => ({ ...h, beds: { 
      general: { ...h.beds.general }, icu: { ...h.beds.icu }, 
      emergency: { ...h.beds.emergency }, ventilator: { ...h.beds.ventilator } 
    }}))
  );

  const [ambulanceSpeed, setAmbulanceSpeed] = useState(0);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(25);
  const [notification, setNotification] = useState<{ title: string; message: string; type: NotificationType } | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ghStartTime = useRef<number | null>(null);
  const accumulatedSimMs = useRef<number>(0);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [routeSwitchModalOpen, setRouteSwitchModalOpen] = useState(false);
  const [currentObstacle, setCurrentObstacle] = useState<string | null>(null);

  const showNotification = useCallback((title: string, message: string, type: NotificationType = 'info') => {
    setNotification({ title, message, type });
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  const findOptimalHospital = useCallback((coords: [number, number], silent: boolean = false) => {
    if (manualHospitalSelection) return selectedHospital;

    let bestHospitalId = selectedHospital;
    let minWaitScore = Infinity;

    hospitalData.forEach(hospital => {
      if (!hospital.open) return;
      
      const dist = Math.sqrt(
        Math.pow(hospital.lat - coords[0], 2) + 
        Math.pow(hospital.lng - coords[1], 2)
      );
      
      // AI weight: ICU availability is crucial (penalty for low beds)
      const icuAvail = hospital.beds.icu.available;
      const bedPenalty = 10 / (icuAvail + 0.1); // Strong penalty for 0 or 1 beds
      
      // Trauma specialist bonus (negative penalty)
      const traumaBonus = hospital.specialties.includes('Trauma') ? -0.5 : 0;
      
      // Dynamic composite score (Distance + Bed Factor + Specialties)
      const compositeScore = (dist * 100) + bedPenalty + (traumaBonus * 10);

      if (icuAvail > 0 && compositeScore < minWaitScore) {
        minWaitScore = compositeScore;
        bestHospitalId = hospital.id;
      }
    });

    if (bestHospitalId !== selectedHospital) {
      setSelectedHospital(bestHospitalId);
      if (!silent) {
        const hName = language === 'hi' 
          ? hospitalData.find(h => h.id === bestHospitalId)?.name_hi 
          : hospitalData.find(h => h.id === bestHospitalId)?.name || 'nearest hospital';
        showNotification(t('optimal_destination'), `${t('ai_selected_info').replace('hospital', hName || '')}`, 'success');
      }
    }
    return bestHospitalId;
  }, [hospitalData, selectedHospital, showNotification, setSelectedHospital, manualHospitalSelection, language, t]);

  const resetGoldenHour = useCallback(() => {
    setGoldenHour(3600);
    setCriticalEventActive(false);
    ghStartTime.current = null;
    accumulatedSimMs.current = 0;
  }, []);

  const stopGoldenHour = useCallback(() => {
    setCriticalEventActive(false);
  }, []);

  const startCriticalEvent = useCallback((severity: 'high' | 'medium' = 'medium') => {
    setPatientType('critical');
    setPatientSeverity(severity);
    setPatientCondition(severity === 'high' ? 'critical' : 'stable');
    // Dynamic Golden Hour: 30 mins for High severity, 60 mins for Medium
    const initialSeconds = severity === 'high' ? 1800 : 3600;
    setGoldenHour(initialSeconds);
    setCriticalEventActive(true);
    ghStartTime.current = Date.now();
    accumulatedSimMs.current = 0;
  }, []);

  const triggerSOS = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setEmergencyCoords(coords);
        startCriticalEvent('high');
        const optimalHospital = findOptimalHospital(coords, true);
        setSelectedHospital(optimalHospital);
        setNavigating(true);
        setMissionStage('to_patient');
        showNotification('🚨 SOS TRIGGERED', 'GPS coordinates sent. Ambulance dispatched.', 'danger');
      }, () => {
        const coords: [number, number] = [30.3705, 78.4302];
        setEmergencyCoords(coords);
        startCriticalEvent('high');
        const optimalHospital = findOptimalHospital(coords, true);
        setSelectedHospital(optimalHospital);
        setNavigating(true);
        setMissionStage('to_patient');
        showNotification('🚨 SOS FALLBACK', 'Network location used. Ambulance dispatched.', 'danger');
      });
    }
  }, [findOptimalHospital, startCriticalEvent, setEmergencyCoords, setNavigating, showNotification, setMissionStage, setSelectedHospital]);

  useEffect(() => {
    if (patientType !== 'critical' || !criticalEventActive || paused) return;

    // Condition-based decay: critical patients lose time faster
    const msPerTick = 1000; // fire every real second

    const interval = setInterval(() => {
      setGoldenHour(prev => {
        let aiScale = patientCondition === 'critical' ? 1.5 : patientCondition === 'deteriorating' ? 1.3 : 1.0;
        const v = vitalsRef.current;
        // AI Optimization: SpO2 drop or extreme Heart Rates aggressively drain the countdown
        if (v.spo2 < 90) aiScale += 0.8;
        if (v.heartRate > 115 || v.heartRate < 50) aiScale += 0.6;
        
        const decayPerTick = simSpeedMultiplier * aiScale;
        const next = Math.max(0, prev - decayPerTick);
        if (next <= 0) setCriticalEventActive(false);
        return Math.floor(next);
      });
    }, msPerTick);

    return () => clearInterval(interval);
  }, [patientType, criticalEventActive, paused, patientCondition, simSpeedMultiplier]);

  useEffect(() => {
    const rains = ['None', 'Light', 'Moderate', 'Light', 'None'];
    const interval = setInterval(() => {
      const temps = [6, 7, 8, 9, 10, 11, 12];
      const vis = [1.2, 1.5, 1.8, 2.1, 2.4, 2.8, 3.2];
      const winds = [18, 20, 22, 25, 28, 30, 15];
      setLiveTemp(temps[Math.floor(Math.random() * temps.length)]);
      setLiveVisibility(vis[Math.floor(Math.random() * vis.length)]);
      setLiveWind(winds[Math.floor(Math.random() * winds.length)]);
      setLiveRain(rains[Math.floor(Math.random() * rains.length)]);

      // Vitals simulation
      if (missionStage !== 'idle') {
        const hrBase = patientCondition === 'critical' ? 110 : patientCondition === 'deteriorating' ? 95 : 80;
        setHeartRate(Math.floor(hrBase + Math.random() * 10));
        const spo2Base = patientCondition === 'critical' ? 88 : patientCondition === 'deteriorating' ? 92 : 97;
        setSpo2(Math.floor(spo2Base + Math.random() * 3));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [missionStage, patientCondition]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHospitalData(prev => prev.map(h => {
        const newBeds = { ...h.beds };
        (Object.keys(newBeds) as Array<keyof typeof newBeds>).forEach(type => {
          if (Math.random() < 0.1) {
            const change = Math.random() < 0.5 ? -1 : 1;
            newBeds[type] = {
              ...newBeds[type],
              available: Math.max(0, Math.min(newBeds[type].total, newBeds[type].available + change))
            };
          }
        });
        return { ...h, beds: newBeds };
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!manualHospitalSelection) setCurrentRouteIdx(0);
  }, [selectedHospital, manualHospitalSelection]);

  const calculateDistance = useCallback((p1: [number, number], p2: [number, number]) => {
    const R = 6371e3; // meters
    const phi1 = p1[0] * Math.PI/180;
    const phi2 = p2[0] * Math.PI/180;
    const deltaPhi = (p2[0]-p1[0]) * Math.PI/180;
    const deltaLambda = (p2[1]-p1[1]) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in meters
  }, []);

  // Automated Ambulance Allocation Logic
  useEffect(() => {
    if (activeRole === 'patient' && sosStatus === 'requested' && emergencyCoords && !activeAmbulanceId) {
      let nearestId: string | null = null;
      let minDistance = Infinity;

      ambulances.forEach(amb => {
        if (amb.status === 'available') {
          const dist = calculateDistance([amb.lat, amb.lng], emergencyCoords);
          if (dist < minDistance) {
            minDistance = dist;
            nearestId = amb.id;
          }
        }
      });

      if (nearestId) {
        const targetId = nearestId as string;
        setAmbulances(prev => prev.map(a => a.id === targetId ? { ...a, status: 'busy' } : a));
        setActiveAmbulanceId(targetId);
        setSosStatus('dispatched');
        showNotification('Ambulance Allocated', `Unit ${targetId} has been dispatched to your location.`, 'success');
      }
    }
  }, [sosStatus, emergencyCoords, activeAmbulanceId, ambulances, activeRole, calculateDistance, setAmbulances, setActiveAmbulanceId, setSosStatus, showNotification]);

  // Continuous GPS Tracking (Driver & Patient)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    
    let watchId: number | null = null;

    if (activeRole === 'driver' && isLiveGPS) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setDriverCoords(coords);
          // Update local ambulance list immediately for self-view
          setAmbulances(prev => prev.map(a => 
            a.id === (activeAmbulanceId || 'amb1') ? { ...a, lat: coords[0], lng: coords[1] } : a
          ));
        },
        (err) => {
          // Silence the console error to avoid spamming the user's logs
          // Instead, provide a clean UI notification and fallback
          if (err.code === 1) { // Permission Denied
            showNotification('GPS Access Required', 'Please enable location permissions for live tracking.', 'warning');
          } else if (err.code === 3) { // Timeout
            // Silence timeouts as they are common on desktop browsers
          } else {
            showNotification('GPS Status', 'Live location unavailable. Switching to simulation.', 'warning');
          }
          
          setIsLiveGPS(false); // This triggers the useEffect cleanup and stops the watch
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
  }, [activeRole, isLiveGPS, sosStatus, activeAmbulanceId]);

  // Synchronization and Real-time Broadcasting Logic
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    syncChannel.current = new BroadcastChannel('teros_live_sync');
    
    syncChannel.current.onmessage = (event) => {
      const { type, payload } = event.data;
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
          
          // Sync missionStage for map routing
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
    };

    return () => syncChannel.current?.close();
  }, [isLiveGPS, activeAmbulanceId]);

  useEffect(() => {
    if (activeRole === 'driver' && driverCoords) {
      // Throttle/Gate broadcasts to prevent saturating the channel in simulation mode
      const payload = { id: activeAmbulanceId || 'amb1', lat: driverCoords[0], lng: driverCoords[1] };
      syncChannel.current?.postMessage({ type: 'UPDATE_DRIVER_LOCATION', payload });
    }
  }, [driverCoords, activeRole, activeAmbulanceId]);

  useEffect(() => {
    if (activeRole === 'patient' && emergencyCoords) {
      syncChannel.current?.postMessage({ type: 'UPDATE_EMERGENCY_COORDS', payload: emergencyCoords });
    }
  }, [emergencyCoords, activeRole]);

  useEffect(() => {
    syncChannel.current?.postMessage({ 
      type: 'UPDATE_SOS_STATUS', 
      payload: { status: sosStatus, activeAmbulanceId, selectedHospital } 
    });
  }, [sosStatus, activeAmbulanceId, selectedHospital]);

  useEffect(() => {
    if (activeRole === 'admin' || activeRole === 'simulation') {
      syncChannel.current?.postMessage({ 
        type: 'UPDATE_MAP_LAYERS', 
        payload: { terrain, weatherLayer, trafficLayer } 
      });
    }
  }, [terrain, weatherLayer, trafficLayer, activeRole]);

  useEffect(() => {
    if (activeRole === 'hospital' || activeRole === 'admin') {
      syncChannel.current?.postMessage({ type: 'UPDATE_HOSPITAL_DATA', payload: hospitalData });
    }
  }, [hospitalData, activeRole]);

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
