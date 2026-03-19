'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';

export default function OfflineBanner() {
  const { offlineMode } = useApp();

  if (!offlineMode) return null;

  return (
    <div style={{
      background: 'var(--warning-light)', borderBottom: '1px solid var(--warning)',
      padding: '6px 16px', fontSize: '11px', fontWeight: 600,
      color: 'var(--warning)', textAlign: 'center',
    }}>
      ⚠ Offline Mode — Using cached map tiles and last known hospital data
    </div>
  );
}
