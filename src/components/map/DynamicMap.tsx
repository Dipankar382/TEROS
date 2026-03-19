'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-center" style={{ width: '100%', height: '100%', background: 'var(--surface-alt)' }}>
      <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading Map Data...</div>
    </div>
  )
});

export default DynamicMap;
