'use client';

import React, { useState, useEffect } from 'react';

export default function LoadingOverlay() {
  const [hidden, setHidden] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), 1200);
    const hideTimer = setTimeout(() => setHidden(true), 1700);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, []);

  if (hidden) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--surface-solid)',
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1, transition: 'opacity 0.5s',
      pointerEvents: fading ? 'none' : 'auto',
    }}>
      <div style={{
        width: '48px', height: '48px',
        border: '3px solid var(--border-strong)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
        Initializing TEROS...
      </div>
    </div>
  );
}
