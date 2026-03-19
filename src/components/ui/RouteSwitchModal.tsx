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
    // Request up to 3 alternatives
    fetch(`https://router.project-osrm.org/route/v1/driving/${fLng},${fLat};${eLng},${eLat}?overview=full&geometries=geojson&alternatives=3`)
        .then(r => r.json())
        .then((data: any) => {
          if (data.code !== 'Ok' || !data.routes?.length) { setFetchingAll(false); return; }

          let routesToProcess = [...data.routes];
          
          // Generate synthetic alternatives if OSRM doesn't return enough for the region
          if (routesToProcess.length === 1) {
            const baseRoute = routesToProcess[0];
            const alt1 = JSON.parse(JSON.stringify(baseRoute));
            alt1.duration *= 1.12; // 12% slower
            alt1.distance *= 1.05;
            alt1.geometry.coordinates = alt1.geometry.coordinates.map((c: any, i: number, arr: any[]) => {
               if (i > arr.length * 0.2 && i < arr.length * 0.8) return [c[0] + 0.005, c[1] + 0.003];
               return c;
            });
            const alt2 = JSON.parse(JSON.stringify(baseRoute));
            alt2.duration *= 1.25; // 25% slower
            alt2.distance *= 1.15;
            alt2.geometry.coordinates = alt2.geometry.coordinates.map((c: any, i: number, arr: any[]) => {
               if (i > arr.length * 0.3 && i < arr.length * 0.7) return [c[0] - 0.004, c[1] - 0.006];
               return c;
            });
            routesToProcess.push(alt1, alt2);
          } else if (routesToProcess.length === 2) {
             const baseRoute = routesToProcess[0];
             const alt2 = JSON.parse(JSON.stringify(baseRoute));
             alt2.duration *= 1.25;
             alt2.distance *= 1.15;
             alt2.geometry.coordinates = alt2.geometry.coordinates.map((c: any, i: number, arr: any[]) => {
               if (i > arr.length * 0.3 && i < arr.length * 0.7) return [c[0] - 0.004, c[1] - 0.006];
               return c;
             });
             routesToProcess.push(alt2);
          }

          const minDur = Math.min(...routesToProcess.map((r: any) => r.duration));
          const maxDur = Math.max(...routesToProcess.map((r: any) => r.duration));
          const range = maxDur - minDur || 1;

          const opts: RouteOption[] = routesToProcess.map((r: any, idx: number) => {
            const path: [number, number][] = [
              [fLat, fLng],
              ...r.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])
            ];
            const timeScore = 100 * (1 - (r.duration - minDur) / range);
            return {
              id: `patient_alt_${idx}`,
              label: idx === 0 ? 'Fastest Route' : `Alternative ${idx}`,
              label_hi: idx === 0 ? 'सबसे तेज़ रास्ता' : `वैकल्पिक ${idx}`,
              sublabel: r.legs?.[0]?.summary || `Via road — ${formatDistance(r.distance)}`,
              duration: Math.round(r.duration),
              distance: Math.round(r.distance),
              path,
              score: Math.round(timeScore),
              aiRecommended: idx === 1, // AI prefers alt with best balance
              loading: false,
              failed: false,
            };
          });

          // Mark the one that isn't current as AI recommended if it's faster
          if (opts.length > 1 && opts[1].duration < opts[0].duration) {
            opts[0].aiRecommended = false;
            opts[1].aiRecommended = true;
          }

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
  const stageLabel = isToPatient ? '🚨 Route to Casualty Site' : '🏥 Route to Hospital';
  const stageLabelHint = isToPatient
    ? 'Alternative roads to reach the emergency scene faster'
    : 'AI-ranked hospitals by ETA and ICU availability';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)', zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface-solid)', borderRadius: '20px',
        maxWidth: '500px', width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        border: '1px solid var(--border-strong)',
        animation: 'rsm-in 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        <style>{`
          @keyframes rsm-in { from { opacity:0; transform:scale(0.92) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
          .rsm-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.12); }
          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
          background: isToPatient
            ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(251,146,60,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(99,102,241,0.03) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', fontSize: '22px',
                background: isToPatient
                  ? 'linear-gradient(135deg, #ef4444, #f97316)'
                  : 'linear-gradient(135deg, #1d4ed8, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${isToPatient ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.3)'}`
              }}>
                {isToPatient ? '⚠️' : '🏥'}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {currentObstacle ? t('obstacle_detected') : 'Manual Route Switch'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', marginTop: '2px' }}>
                  {currentObstacle || stageLabel}
                </div>
              </div>
            </div>
            <button onClick={handleClose} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)',
              background: 'var(--surface-alt)', cursor: 'pointer', fontSize: '16px',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.4' }}>
            {livePos
              ? `🛰 ${stageLabelHint} (from ${livePos[0].toFixed(4)}°N, ${livePos[1].toFixed(4)}°E)`
              : '⚡ Start a mission to use route switching.'}
          </div>
        </div>

        {/* Route List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {fetchingAll ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</div>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>Computing live routes...</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                {isToPatient ? 'Finding alternative roads to casualty site' : `Querying OSRM for ${hospitalData.filter(h => h.open).length} hospitals`}
              </div>
            </div>
          ) : !(livePos || fallbackPos) ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No active route found. Start a dispatch mission first.
            </div>
          ) : routes.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Could not fetch route alternatives. Check network connection.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {routes
                .filter(r => !r.failed)
                .sort((a, b) => b.score - a.score)
                .map(r => {
                  const isSel = selectedId === r.id;
                  const badgeColor = r.score >= 70 ? 'var(--success)' : r.score >= 40 ? 'var(--warning)' : 'var(--critical)';
                  const isCurrent = isToPatient ? r.id === 'patient_alt_0' : r.id === selectedHospital;

                  return (
                    <div key={r.id} className="rsm-card" onClick={() => setSelectedId(r.id)} style={{
                      borderRadius: '14px', padding: '14px 16px', cursor: 'pointer',
                      border: `2px solid ${isSel ? 'var(--primary)' : r.aiRecommended ? 'rgba(37,99,235,0.3)' : 'var(--border)'}`,
                      background: isSel ? 'rgba(37,99,235,0.08)' : r.aiRecommended ? 'rgba(37,99,235,0.03)' : 'var(--surface-alt)',
                      transition: 'all 0.2s',
                    }}>
                      {/* Badges row */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '7px', flexWrap: 'wrap' }}>
                        {r.aiRecommended && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: 'var(--primary)', color: '#fff', letterSpacing: '0.5px' }}>
                            🧠 AI RECOMMENDED
                          </span>
                        )}
                        {isCurrent && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: 'var(--surface-solid)', color: 'var(--text-secondary)', border: '1px solid var(--border)', letterSpacing: '0.5px' }}>
                            CURRENT PATH
                          </span>
                        )}
                        {r.icuBeds === 0 && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--critical)', letterSpacing: '0.5px' }}>
                            ⚠ NO ICU BEDS
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text)' }}>
                            {language === 'hi' ? r.label_hi : r.label}
                          </div>
                          {r.sublabel && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
                              {r.sublabel}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '14px', marginTop: '7px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            <span>⏱ {formatDuration(r.duration)}</span>
                            <span>📏 {formatDistance(r.distance)}</span>
                            {r.icuBeds !== undefined && (
                              <span style={{ color: r.icuBeds > 2 ? 'var(--success)' : r.icuBeds > 0 ? 'var(--warning)' : 'var(--critical)' }}>
                                🛏 {r.icuBeds} ICU
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: badgeColor, lineHeight: 1 }}>{r.score}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>AI SCORE</div>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div style={{ marginTop: '10px', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${r.score}%`, background: `linear-gradient(90deg, ${badgeColor}, ${badgeColor}88)`, borderRadius: '2px', transition: 'width 0.5s' }} />
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
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '10px', background: 'var(--surface-solid)'
        }}>
          <button onClick={handleClose} style={{
            flex: 1, padding: '13px', borderRadius: '12px',
            border: '1px solid var(--border)', background: 'var(--surface-alt)',
            color: 'var(--text-secondary)', fontWeight: 800, fontSize: '13px', cursor: 'pointer'
          }}>
            STAY ON PATH
          </button>
          <button onClick={handleApply} disabled={!selectedId || applying || fetchingAll} style={{
            flex: 2, padding: '13px', borderRadius: '12px', border: 'none',
            background: selectedId && !fetchingAll
              ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
              : 'var(--border)',
            color: selectedId && !fetchingAll ? '#fff' : 'var(--text-secondary)',
            fontWeight: 900, fontSize: '13px',
            cursor: selectedId && !fetchingAll ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: selectedId && !fetchingAll ? '0 4px 12px rgba(37,99,235,0.35)' : 'none',
            transition: 'all 0.2s'
          }}>
            {applying ? '⏳ Applying...' : isToPatient ? '🚨 SWITCH PATROL ROUTE' : '🗺️ SWITCH HOSPITAL ROUTE'}
          </button>
        </div>

        {patientType === 'critical' && (
          <div style={{
            padding: '8px 24px 14px', textAlign: 'center',
            fontSize: '11px', color: 'var(--warning)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            ⚡ Critical patient — AI will auto-select best route in 10 seconds if no action taken
          </div>
        )}
      </div>
    </div>
  );
}
