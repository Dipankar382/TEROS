'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { User, Navigation, Hospital as HospitalIcon, Shield } from 'lucide-react';

export default function RoleSelector() {
  const { activeRole, setActiveRole } = useApp();

  const roles = [
    { id: 'simulation', label: 'Exit Panel', icon: User, color: 'var(--text-muted)' },
    { id: 'patient', label: 'Patient', icon: User, color: 'var(--critical)' },
    { id: 'driver', label: 'Driver', icon: Navigation, color: 'var(--success)' },
    { id: 'hospital', label: 'Hospital', icon: HospitalIcon, color: 'var(--primary)' },
    { id: 'admin', label: 'Admin', icon: Shield, color: 'var(--critical)' },
  ];

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', padding: '6px', 
      background: 'var(--surface)',
      backdropFilter: 'var(--backdrop-blur)',
      WebkitBackdropFilter: 'var(--backdrop-blur)',
      borderRadius: 'var(--radius-lg)', 
      border: '1px solid var(--border)', 
      margin: '0 auto',
      width: 'fit-content',
      maxWidth: 'calc(100% - 24px)',
      boxShadow: 'var(--shadow-lg)',
      pointerEvents: 'auto',
      zIndex: 2500,
    }}>
      <div className="role-grid" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '4px',
      }}>
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = activeRole === role.id;
        return (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id as any)}
            style={{
              padding: '8px 14px', borderRadius: '12px', border: 'none',
              background: isActive ? role.color : 'transparent',
              color: isActive ? 'white' : 'var(--text-secondary)',
              fontSize: '11px', fontWeight: isActive ? 900 : 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive ? `0 4px 15px ${role.color}66` : 'none',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              flex: '1 1 auto',
              whiteSpace: 'nowrap'
            }}
          >
            <Icon size={16} />
            <span style={{ letterSpacing: '0.5px' }}>{role.label.toUpperCase()}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
