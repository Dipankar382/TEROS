'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';

export default function Notification() {
  const { notification } = useApp();
  
  const borderColors: Record<string, string> = {
    info: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
  };

  return (
    <div style={{
      position: 'fixed', top: '70px', right: '20px', zIndex: 4000,
      background: 'var(--surface-solid)', borderRadius: 'var(--radius-sm)', padding: '14px 18px',
      boxShadow: 'var(--shadow-lg)',
      borderLeft: `4px solid ${notification ? borderColors[notification.type] || borderColors.info : borderColors.info}`,
      transform: notification ? 'translateX(0)' : 'translateX(120%)',
      transition: 'transform 0.3s ease',
      maxWidth: '320px',
      backdropFilter: 'var(--backdrop-blur)',
      WebkitBackdropFilter: 'var(--backdrop-blur)',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px', color: 'var(--text)' }}>
        {notification?.title}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        {notification?.message}
      </div>
    </div>
  );
}
