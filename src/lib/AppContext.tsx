'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { hospitals as initialHospitals, routes, type Hospital } from '@/lib/mockData';

type NotificationType = 'info' | 'success' | 'warning' | 'danger';

type AppState = {
  patientType: 'critical' | 'normal';
  setPatientType: (t: 'critical' | 'normal') => void;
  missionStage: 'idle' | 'to_patient' | 'to_hospital';
  setMissionStage: (s: 'idle' | 'to_patient' | 'to_hospital') => void;
  goldenHour: number;
  resetGoldenHour: () => void;
  criticalEventActive: boolean;
  startCriticalEvent: () => void;
  selectedHospital: string;
  setSelectedHospital: (id: string) => void;
  navigating: boolean;
  setNavigating: (v: boolean) => void;
  paused: boolean;
  setPaused: (v: boolean) => void;
  currentRouteIdx: number;
  setCurrentRouteIdx: (idx: number) => void;
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
  ambulanceSpeed: number;
  setAmbulanceSpeed: (s: number) => void;
  simSpeedMultiplier: number;
  setSimSpeedMultiplier: (m: number) => void;
  emergencyCoords: [number, number] | null;
  setEmergencyCoords: (coords: [number, number] | null) => void;
  mockEmergencies: Array<{ id: string; name: string; lat: number; lng: number; description: string }>;
  // Notification
  notification: { title: string; message: string; type: NotificationType } | null;
  showNotification: (title: string, message: string, type?: NotificationType) => void;
  // Modals
  emergencyModalOpen: boolean;
  setEmergencyModalOpen: (v: boolean) => void;
  routeSwitchModalOpen: boolean;
  setRouteSwitchModalOpen: (v: boolean) => void;
  findOptimalHospital: (coords: [number, number], silent?: boolean) => string;
  triggerSOS: () => void;
  stopGoldenHour: () => void;
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patientType, setPatientType] = useState<'critical' | 'normal'>('critical');
  const [missionStage, setMissionStage] = useState<'idle' | 'to_patient' | 'to_hospital'>('idle');
  const [goldenHour, setGoldenHour] = useState(3600); // 1 hour default
  const [criticalEventActive, setCriticalEventActive] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState('aiims_rishikesh');
  const [navigating, setNavigating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentRouteIdx, setCurrentRouteIdx] = useState(0);
  const [ambulanceProgress, setAmbulanceProgress] = useState(0);
  
  const [emergencyCoords, setEmergencyCoords] = useState<[number, number] | null>(null);

  const mockEmergencies = [
    { id: 'nh7_landslide', name: 'Landslide on NH-7', lat: 30.1250, lng: 78.3150, description: 'Blocked road near Shivpuri' },
    { id: 'thdc_spill', name: 'Lab Chemical Spill - THDC IHET', lat: 30.3705, lng: 78.4302, description: 'Inhalation risk at campus lab' },
    { id: 'tehri_dam_accident', name: 'Accident - Tehri Dam Viewpoint', lat: 30.3780, lng: 78.4750, description: 'Vehicle fall near dam reservoir' },
    { id: 'chamba_landslide', name: 'Landslide - Chamba Road', lat: 30.3550, lng: 78.4050, description: 'Major blockage on New Tehri road' },
    { id: 'city_heart', name: 'Heart Attack - City Center', lat: 30.0869, lng: 78.2676, description: 'Emergency near Laxman Jhula' },
    { id: 'trekker_injury', name: 'Trekker Injury - Neer Garh', lat: 30.1420, lng: 78.3310, description: 'Falls from height, head injury' },
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
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(25); // 25x faster than real-time by default

  const [notification, setNotification] = useState<{ title: string; message: string; type: NotificationType } | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ghStartTime = useRef<number | null>(null);
  const accumulatedSimMs = useRef<number>(0);

  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [routeSwitchModalOpen, setRouteSwitchModalOpen] = useState(false);

  const showNotification = useCallback((title: string, message: string, type: NotificationType = 'info') => {
    setNotification({ title, message, type });
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  const findOptimalHospital = useCallback((coords: [number, number], silent: boolean = false) => {
    let bestHospitalId = selectedHospital;
    let minWaitScore = Infinity;

    hospitalData.forEach(hospital => {
      if (!hospital.open) return;
      
      const dist = Math.sqrt(
        Math.pow(hospital.lat - coords[0], 2) + 
        Math.pow(hospital.lng - coords[1], 2)
      );
      
      const bedPenalty = 5 / (hospital.beds.icu.available + 0.5);
      const compositeScore = dist * 100 + bedPenalty;

      if (compositeScore < minWaitScore) {
        minWaitScore = compositeScore;
        bestHospitalId = hospital.id;
      }
    });

    if (bestHospitalId !== selectedHospital) {
      setSelectedHospital(bestHospitalId);
      if (!silent) {
        const hName = hospitalData.find(h => h.id === bestHospitalId)?.name || 'nearest hospital';
        showNotification('AI Optimal Redirect', `Directed to ${hName} based on proximity & capacity.`, 'success');
      }
    }
    return bestHospitalId;
  }, [hospitalData, selectedHospital, showNotification, setSelectedHospital]); // Added setSelectedHospital to dependencies

  const resetGoldenHour = useCallback(() => {
    setGoldenHour(3600);
    setCriticalEventActive(false);
    ghStartTime.current = null;
    accumulatedSimMs.current = 0;
  }, []);

  const stopGoldenHour = useCallback(() => {
    setCriticalEventActive(false);
    // Timer stays at current value (frozen)
  }, []);

  const startCriticalEvent = useCallback(() => {
    setPatientType('critical');
    setGoldenHour(3600);
    setCriticalEventActive(true);
    ghStartTime.current = Date.now();
    accumulatedSimMs.current = 0;
  }, []);

  const triggerSOS = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setEmergencyCoords(coords);
        setPatientType('critical');
        setGoldenHour(3600);
        setCriticalEventActive(true);
        ghStartTime.current = Date.now();
        accumulatedSimMs.current = 0;
        const optimalHospital = findOptimalHospital(coords, true); // Call findOptimalHospital
        setSelectedHospital(optimalHospital); // Set the selected hospital
        setNavigating(true);
        setMissionStage('to_patient');
        showNotification('🚨 SOS TRIGGERED', 'GPS coordinates sent. Ambulance dispatched.', 'danger');
      }, () => {
        // Fallback to THDC IHET if geolocation fails
        const coords: [number, number] = [30.3705, 78.4302];
        setEmergencyCoords(coords);
        setPatientType('critical');
        setGoldenHour(3600);
        setCriticalEventActive(true);
        ghStartTime.current = Date.now();
        accumulatedSimMs.current = 0;
        const optimalHospital = findOptimalHospital(coords, true); // Call findOptimalHospital
        setSelectedHospital(optimalHospital); // Set the selected hospital
        setNavigating(true);
        setMissionStage('to_patient');
        showNotification('🚨 SOS FALLBACK', 'Network location used. Ambulance dispatched.', 'danger');
      });
    }
  }, [findOptimalHospital, setEmergencyCoords, setNavigating, setPatientType, showNotification, setMissionStage, setSelectedHospital]); // Added setSelectedHospital to dependencies

  // Golden Hour Timer (Sync with simulation speed and pause)
  useEffect(() => {
    if (patientType !== 'critical' || !criticalEventActive || !ghStartTime.current) return;
    
    if (paused) {
      // When pausing, save the elapsed simulation time
      const realElapsedMs = Date.now() - ghStartTime.current;
      accumulatedSimMs.current += realElapsedMs * simSpeedMultiplier;
      ghStartTime.current = null;
      return;
    } else {
      // When resuming, reset start time
      if (!ghStartTime.current) {
        ghStartTime.current = Date.now();
      }
    }

    const interval = setInterval(() => {
      if (!ghStartTime.current) return;
      const realElapsedMs = Date.now() - ghStartTime.current;
      const currentSimMs = accumulatedSimMs.current + (realElapsedMs * simSpeedMultiplier);
      const remaining = Math.max(0, 3600 - (currentSimMs / 1000));
      setGoldenHour(Math.floor(remaining));
    }, 100);
    
    return () => clearInterval(interval);
  }, [patientType, criticalEventActive, simSpeedMultiplier, paused]);

  // Live Sensors Simulation
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
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Live bed availability simulation
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

  // Reset route index when hospital changes
  useEffect(() => {
    setCurrentRouteIdx(0);
  }, [selectedHospital]);

  return (
    <AppContext.Provider value={{
      patientType, setPatientType,
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
      ambulanceSpeed, setAmbulanceSpeed,
      simSpeedMultiplier, setSimSpeedMultiplier,
      notification, showNotification,
      emergencyModalOpen, setEmergencyModalOpen,
      routeSwitchModalOpen, setRouteSwitchModalOpen,
      findOptimalHospital,
      triggerSOS,
      stopGoldenHour,
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
