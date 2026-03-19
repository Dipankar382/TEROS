'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/lib/AppContext';
import { hospitals, weatherData } from '@/lib/mockData';

// ─── Types ──────────────────────────────────────────────────────────────────

type RouteOption = {
  id: string;           // hospitalId OR 'alt_0', 'alt_1' for patient routes
  label: string;
  label_hi: string;
  sublabel?: string;    // e.g. "Via NH-58" from OSRM summary
  duration: number;     // seconds
  distance: number;     // meters
  path: [number, number][];
  icuBeds?: number;     // only for hospital routes
  score: number;
  aiRecommended: boolean;
  loading: boolean;
  failed: boolean;
};

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function interpolateLivePos(path: number[][], progress: number): [number, number] | null {
  if (!path || path.length < 2) return null;
  const totalSegs = path.length - 1;
  const prog = progress * totalSegs;
  const segIdx = Math.min(Math.floor(prog), totalSegs - 1);
  const segProg = prog - segIdx;
  const lat = path[segIdx][0] + (path[segIdx + 1][0] - path[segIdx][0]) * segProg;
  const lng = path[segIdx][1] + (path[segIdx + 1][1] - path[segIdx][1]) * segProg;
  return [lat, lng];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RouteSwitchModal() {
  const {
    routeSwitchModalOpen, setRouteSwitchModalOpen,
    missionStage,
    ambulanceProgress,
    toPatientPath, setToPatientPath,
    toHospitalPath, setToHospitalPath,
    emergencyCoords,
    selectedHospital, setSelectedHospital,
    setAmbulanceProgress,
    setPaused, showNotification, language, t,
    currentObstacle, hospitalData, patientType,
    setCurrentRouteIdx,
    setPreviewRoutes,
    previewSelectedId, setPreviewSelectedId
  } = useApp();

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [fetchingAll, setFetchingAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Which path are we currently on?
  const activePath = missionStage === 'to_patient' ? toPatientPath : toHospitalPath;

  // ── Live position ────────────────────────────────────────────────────────
  const getLivePos = useCallback((): [number, number] | null => {
    return interpolateLivePos(activePath || [], ambulanceProgress);
  }, [activePath, ambulanceProgress]);

  const fallbackPos: [number, number] | null = missionStage === 'to_patient' 
    ? [30.0869, 78.2676] // Ambulance Station
    : emergencyCoords;

  const livePos = getLivePos();
  const currentPos = livePos || fallbackPos;

  // ── Fetch alternatives when modal opens ─────────────────────────────────
  useEffect(() => {
    if (!routeSwitchModalOpen) { setRoutes([]); return; }

    if (!currentPos) {
      if (missionStage === 'idle') {
        setFetchingAll(false);
      } else {
        setFetchingAll(true);
        // Wait and retry if mission is active but path is loading
        const t = setTimeout(() => {
          if (routeSwitchModalOpen) setFetchingAll(false); // Trigger re-render to catch path
        }, 1000);
        return () => clearTimeout(t);
      }
      return;
    }

    setFetchingAll(true);
    setSelectedId(missionStage === 'to_patient' ? 'patient_alt_0' : selectedHospital);

    if (missionStage === 'to_patient') {
      // ── Stage 1: fetch ≤3 OSRM alternative paths to the casualty site ──
      if (!emergencyCoords) { setFetchingAll(false); return; }
      const [eLat, eLng] = emergencyCoords;
      const [fLat, fLng] = currentPos;

      // Build 3 geometrically distinct paths by routing via unique intermediate waypoints.
      // The waypoints are placed at perpendicular offsets from the straight-line midpoint,
      // making each alternative diverge visually on the map (not just tiny nudges).
      const midLat = (fLat + eLat) / 2;
      const midLng = (fLng + eLng) / 2;
      const dLat = eLat - fLat;
      const dLng = eLng - fLng;
      // Perpendicular direction (rotate 90°)
      const perpLat = -dLng;
      const perpLng = dLat;
      const norm = Math.sqrt(perpLat * perpLat + perpLng * perpLng) || 1;
      const scale = 0.05; // ~5 km lateral offset

      const waypoints = [
        null,                                                                          // Direct fastest
        [midLat + perpLat / norm * scale, midLng + perpLng / norm * scale] as [number, number],    // Left detour
        [midLat - perpLat / norm * scale * 1.3, midLng - perpLng / norm * scale * 1.3] as [number, number],  // Right wider
      ];

      const fetchRoute = async (via: [number, number] | null): Promise<any | null> => {
        const url = via
          ? `https://router.project-osrm.org/route/v1/driving/${fLng},${fLat};${via[1]},${via[0]};${eLng},${eLat}?overview=full&geometries=geojson`
          : `https://router.project-osrm.org/route/v1/driving/${fLng},${fLat};${eLng},${eLat}?overview=full&geometries=geojson`;
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.code === 'Ok' && data.routes?.[0]) return data.routes[0];
        } catch (_) {}
        return null;
      };

      Promise.all(waypoints.map(w => fetchRoute(w)))
        .then(results => {
          const valid = results.filter(Boolean);
          if (!valid.length) { setFetchingAll(false); return; }

          const minDur = Math.min(...valid.map((r: any) => r.duration));
          const maxDur = Math.max(...valid.map((r: any) => r.duration));
          const range = maxDur - minDur || 1;

          const opts: RouteOption[] = valid.map((r: any, idx: number) => {
            const path: [number, number][] = r.geometry.coordinates.map(
              (c: number[]) => [c[1], c[0]] as [number, number]
            );
            const timeScore = 100 * (1 - (r.duration - minDur) / range);
            return {
              id: `patient_alt_${idx}`,
              label: idx === 0 ? 'Direct Route' : idx === 1 ? 'Northern Detour' : 'Southern Detour',
              label_hi: idx === 0 ? 'सीधा मार्ग' : idx === 1 ? 'उत्तरी मार्ग' : 'दक्षिणी मार्ग',
              sublabel: r.legs?.[0]?.summary || `${idx === 0 ? 'Fastest path' : idx === 1 ? 'Via left bypass' : 'Via right bypass'} — ${formatDistance(r.distance)}`,
              duration: Math.round(r.duration),
              distance: Math.round(r.distance),
              path,
              score: Math.round(timeScore),
              aiRecommended: idx === 0,
              loading: false,
              failed: false,
            };
          });

          setRoutes(opts);
          setPreviewRoutes(opts.map(o => ({ id: o.id, path: o.path })));
          setSelectedId(opts[0].id);
          setFetchingAll(false);
        })
        .catch(() => setFetchingAll(false));

    } else {
      // ── Stage 2: fetch OSRM routes from live pos to ALL open hospitals ──
      if (!currentPos) { setFetchingAll(false); return; }
      const [fLat, fLng] = currentPos;
      const openHospitals = hospitalData.filter(h => h.open);

      Promise.all(
        openHospitals.map(async (h): Promise<RouteOption> => {
          const base: RouteOption = {
            id: h.id, label: h.name, label_hi: h.name_hi,
            duration: 0, distance: 0, path: [],
            icuBeds: h.beds.icu.available,
            score: 0, aiRecommended: false, loading: true, failed: false,
          };
          try {
            const res = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${fLng},${fLat};${h.lng},${h.lat}?overview=full&geometries=geojson`
            );
            const data = await res.json();
            if (data.code === 'Ok' && data.routes?.[0]) {
              const r = data.routes[0];
              return {
                ...base,
                duration: Math.round(r.duration),
                distance: Math.round(r.distance),
                path: [[fLat, fLng], ...r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])],
                loading: false,
              };
            }
          } catch (_) {}
          return { ...base, loading: false, failed: true };
        })
      ).then(results => {
        const valid = results.filter(r => !r.failed && r.path.length > 1);
        if (!valid.length) { setRoutes(results); setFetchingAll(false); return; }

        const minDur = Math.min(...valid.map(r => r.duration));
        const maxDur = Math.max(...valid.map(r => r.duration));
        const range = maxDur - minDur || 1;

        const scored = results.map(r => {
          if (r.failed || r.path.length <= 1) return { ...r, score: 0 };
          
          let score = 0;
          const timeScore = 60 * (1 - (r.duration - minDur) / range);
          const bedScore = Math.min(40, (r.icuBeds || 0) * 5);
          score = timeScore + bedScore;

          // Weather Penalty: Deduct points if route passes near severe weather
          const severeZones = weatherData.filter(w => w.severe);
          const hasWeatherRisk = r.path.some(pt => 
            severeZones.some(sz => {
              const dist = Math.sqrt(Math.pow(pt[0] - sz.lat, 2) + Math.pow(pt[1] - sz.lng, 2));
              return dist < 0.05; // ~5km radius
            })
          );
          if (hasWeatherRisk) score -= 30;

          // Terrain Penalty: Deduct points for high-altitude destinations (simulated)
          const destLat = r.path[r.path.length - 1][0];
          if (destLat > 30.5) score -= 15; // Higher mountains = more risk

          return { ...r, score: Math.max(0, Math.round(score)) };
        });

        const bestValid = [...scored].filter(r => !r.failed && r.id !== selectedHospital)
          .sort((a, b) => b.score - a.score)[0];
        const final = scored.map(r => ({ ...r, aiRecommended: r.id === bestValid?.id }));

        setRoutes(final);
        setPreviewRoutes(final.filter(r => !r.failed).map(o => ({ id: o.id, path: o.path })));
        setPreviewSelectedId(selectedHospital);
        setSelectedId(selectedHospital);
        setFetchingAll(false);
      });
    }
  }, [routeSwitchModalOpen]);

  useEffect(() => {
    setPreviewSelectedId(selectedId);
  }, [selectedId, setPreviewSelectedId]);

  // ── Apply selected route ────────────────────────────────────────────────
  const handleApply = () => {
    if (!selectedId || applying || fetchingAll) return;
    const route = routes.find(r => r.id === selectedId);
    if (!route || route.failed || route.path.length <= 1) {
      showNotification('Route Error', 'Selected route has no valid path.', 'danger');
      return;
    }

    setApplying(true);

    if (missionStage === 'to_patient') {
      setToPatientPath(route.path);
    } else {
      setSelectedHospital(route.id);
      setToHospitalPath(route.path);
      setCurrentRouteIdx(0);
    }

    setAmbulanceProgress(0);
    setPreviewRoutes([]);
    setPreviewSelectedId(null);
    setRouteSwitchModalOpen(false);
    setPaused(false);
    setApplying(false);

    const name = language === 'hi' ? route.label_hi : route.label;
    showNotification(
      '🗺️ Route Updated',
      `${missionStage === 'to_patient' ? 'New path to casualty site' : `Redirecting to ${name}`} — ${formatDuration(route.duration)} (${formatDistance(route.distance)})`,
      'success'
    );
  };

  const handleClose = () => { 
    setPreviewRoutes([]);
    setPreviewSelectedId(null);
    setRouteSwitchModalOpen(false); 
    setPaused(false); 
  };

  if (!routeSwitchModalOpen) return null;

  const isToPatient = missionStage === 'to_patient';
  const stageLabel = isToPatient ? '🚨 Casualty Route' : '🏥 Hospital Route';

  return (
    <>
      <style>{`
        @keyframes rsm-slide-in { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .rsm-card { transition: all 0.2s; cursor:pointer; }
        .rsm-card:hover { transform: translateY(-1px); }
      `}</style>

      {/* Semi-transparent backdrop (click to close) */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 8900,
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Side-sheet panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(420px, 100vw)',
        zIndex: 9000,
        background: 'var(--surface-solid)',
        borderLeft: '1px solid var(--border-strong)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
        animation: 'rsm-slide-in 0.3s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          background: isToPatient
            ? 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(251,146,60,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(99,102,241,0.03) 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', fontSize: '20px',
                background: isToPatient
                  ? 'linear-gradient(135deg, #ef4444, #f97316)'
                  : 'linear-gradient(135deg, #1d4ed8, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{isToPatient ? '⚠️' : '🏥'}</div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {currentObstacle ? 'Obstacle Detected' : 'Route Switch'}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text)' }}>
                  {currentObstacle || stageLabel}
                </div>
              </div>
            </div>
            <button onClick={handleClose} style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--surface-alt)',
              cursor: 'pointer', fontSize: '15px', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
          {livePos && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              🛰 From {livePos[0].toFixed(4)}°N, {livePos[1].toFixed(4)}°E
            </div>
          )}
          {patientType === 'critical' && (
            <div style={{
              marginTop: '8px', padding: '6px 10px', borderRadius: '6px',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              fontSize: '11px', fontWeight: 700, color: '#d97706',
            }}>
              ⚡ Critical — AI auto-applies best route in 10s if no action taken
            </div>
          )}
        </div>

        {/* Route List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {fetchingAll ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Computing live routes…</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isToPatient ? 'Finding alternative roads to casualty site' : `Querying ${hospitalData.filter(h => h.open).length} hospitals`}
              </div>
            </div>
          ) : routes.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {livePos || fallbackPos ? 'Could not fetch routes. Check network.' : 'No active route. Start a dispatch first.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {routes
                .filter(r => !r.failed)
                .sort((a, b) => b.score - a.score)
                .map(r => {
                  const isSel = selectedId === r.id;
                  const badgeColor = r.score >= 70 ? 'var(--success)' : r.score >= 40 ? 'var(--warning)' : 'var(--critical)';
                  const isCurrent = isToPatient ? r.id === 'patient_alt_0' : r.id === selectedHospital;

                  return (
                    <div key={r.id} className="rsm-card" onClick={() => setSelectedId(r.id)} style={{
                      borderRadius: '12px', padding: '12px 14px',
                      border: `2px solid ${isSel ? 'var(--primary)' : r.aiRecommended ? 'rgba(37,99,235,0.3)' : 'var(--border)'}`,
                      background: isSel ? 'rgba(37,99,235,0.08)' : r.aiRecommended ? 'rgba(37,99,235,0.03)' : 'var(--surface-alt)',
                    }}>
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        {r.aiRecommended && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'var(--primary)', color: '#fff', letterSpacing: '0.5px' }}>
                            🧠 AI PICK
                          </span>
                        )}
                        {isCurrent && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                            CURRENT
                          </span>
                        )}
                        {r.icuBeds === 0 && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--critical)' }}>
                            ⚠ NO ICU
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text)' }}>
                            {language === 'hi' ? r.label_hi : r.label}
                          </div>
                          {r.sublabel && (
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px', fontStyle: 'italic' }}>
                              {r.sublabel}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, flexWrap: 'wrap' }}>
                            <span>⏱ {formatDuration(r.duration)}</span>
                            <span>📏 {formatDistance(r.distance)}</span>
                            {r.icuBeds !== undefined && (
                              <span style={{ color: r.icuBeds > 2 ? 'var(--success)' : r.icuBeds > 0 ? 'var(--warning)' : 'var(--critical)' }}>
                                🛏 {r.icuBeds} ICU
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                          <div style={{ fontSize: '20px', fontWeight: 900, color: badgeColor, lineHeight: 1 }}>{r.score}</div>
                          <div style={{ fontSize: '8px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>SCORE</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '8px', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${r.score}%`, background: badgeColor, borderRadius: '2px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}

              {routes.filter(r => r.failed).length > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.7 }}>
                  {routes.filter(r => r.failed).length} option(s) unavailable via OSRM.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 16px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '8px', background: 'var(--surface-solid)', flexShrink: 0,
        }}>
          <button onClick={handleClose} style={{
            flex: 1, padding: '11px', borderRadius: '10px',
            border: '1px solid var(--border)', background: 'var(--surface-alt)',
            color: 'var(--text-secondary)', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
          }}>Stay on Path</button>
          <button onClick={handleApply} disabled={!selectedId || applying || fetchingAll} style={{
            flex: 2, padding: '11px', borderRadius: '10px', border: 'none',
            background: selectedId && !fetchingAll
              ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
              : 'var(--border)',
            color: selectedId && !fetchingAll ? '#fff' : 'var(--text-secondary)',
            fontWeight: 900, fontSize: '12px',
            cursor: selectedId && !fetchingAll ? 'pointer' : 'not-allowed',
            boxShadow: selectedId && !fetchingAll ? '0 4px 12px rgba(37,99,235,0.35)' : 'none',
            transition: 'all 0.2s',
          }}>
            {applying ? '⏳ Applying…' : isToPatient ? '🚨 SWITCH ROUTE' : '🗺️ REROUTE TO HOSPITAL'}
          </button>
        </div>
      </div>
    </>
  );
}


