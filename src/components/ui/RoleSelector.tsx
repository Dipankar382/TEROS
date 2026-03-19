'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { User, Navigation, Hospital as HospitalIcon, Shield } from 'lucide-react';

export default function RoleSelector() {
  const { activeRole, setActiveRole } = useApp();

  const roles = [
    { id: 'simulation', label: 'Exit Demo', icon: User, color: 'var(--text-muted)' },
    { id: 'patient', label: 'Patient', icon: User, color: 'var(--critical)' },
    { id: 'driver', label: 'Driver', icon: Navigation, color: 'var(--success)' },
    { id: 'hospital', label: 'Hospital', icon: HospitalIcon, color: 'var(--primary)' },
    { id: 'admin', label: 'Admin', icon: Shield, color: 'var(--critical)' },
  ];

  return (
    <div style={{
      display: 'flex', gap: '6px', padding: '6px', 
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      borderRadius: '30px', 
      border: '1px solid rgba(255, 255, 255, 0.3)', 
      margin: '0 auto',
      width: 'fit-content',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      pointerEvents: 'auto'
    }}>
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = activeRole === role.id;
        return (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id as any)}
            style={{
              padding: '10px 20px', borderRadius: '25px', border: 'none',
              background: isActive ? role.color : 'transparent',
              color: isActive ? 'white' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive ? `0 4px 15px ${role.color}66` : 'none',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <Icon size={16} />
            <span style={{ letterSpacing: '0.5px' }}>{role.label.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
