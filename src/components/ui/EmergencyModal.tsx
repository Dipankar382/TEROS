'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';

export default function EmergencyModal() {
  const { 
    emergencyModalOpen, setEmergencyModalOpen,
    triggerSOS
  } = useApp();

  if (!emergencyModalOpen) return null;

  const handleConfirm = () => {
    setEmergencyModalOpen(false);
    triggerSOS();
  };

  return (
    <div style={{
      display: 'flex', position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)', zIndex: 5000,
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--surface-solid)', borderRadius: 'var(--radius-lg)',
        padding: '28px', maxWidth: '440px', width: '90%', boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
          🚨 Emergency Alert Triggered
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Patient location has been captured. Nearest hospitals are being contacted. Golden hour timer has started.
        </div>

        <div style={{
          background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)',
          padding: '12px', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Captured Location
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
            30.0869° N, 78.2676° E
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Rishikesh, Uttarakhand
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setEmergencyModalOpen(false)}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', background: 'var(--surface-alt)', color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', background: 'var(--danger)', color: '#fff',
            }}
          >
            Confirm & Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}
