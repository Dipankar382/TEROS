'use client';

import React from 'react';
import { useTheme } from '../ThemeProvider';
import { useApp } from '@/lib/AppContext';
import { Moon, Sun, WifiOff, AlertTriangle, Menu, X } from 'lucide-react';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { 
    offlineMode, setOfflineMode, 
    setEmergencyModalOpen, showNotification, 
    language, setLanguage, t,
    isSidebarOpen, setIsSidebarOpen 
  } = useApp();

  const handleOffline = () => {
    const newMode = !offlineMode;
    setOfflineMode(newMode);
    if (newMode) {
      showNotification('Offline Mode', 'Using cached tiles and last known hospital data.', 'warning');
    } else {
      showNotification('Online', 'Live data connection restored.', 'success');
    }
  };

  return (
    <header style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '64px',
      background: 'var(--surface)', borderBottom: '1px solid var(--border)', zIndex: 2000,
      position: 'relative', backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
    }}>
      {/* Left: Logo & Hamburger toggle */}
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="mobile-only"
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            display: 'none', // Controlled by globals.css
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div style={{ 
          width: '34px', height: '34px', borderRadius: '8px', 
          background: 'linear-gradient(135deg, #1B73E8, #0D47A1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.5px' 
        }}>
          T
        </div>
        <div>
          <h1 className="logo-text" style={{ fontSize: '17px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px', color: 'var(--text)' }}>
            <span style={{ color: 'var(--primary)' }}>TEROS</span>
          </h1>
          <div className="logo-sub" style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '-2px' }}>
            Emergency Healthcare Routing
          </div>
        </div>
      </div>

      {/* Center: Status Pills & Language Toggle */}
      <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          style={{
            padding: '5px 12px', borderRadius: '20px',
            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
            background: 'var(--primary-light)', color: 'var(--primary)',
            border: '1px solid var(--primary)', cursor: 'pointer',
            marginRight: '12px'
          }}
        >
          {language === 'en' ? 'हिन्दी' : 'ENGLISH'}
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
          background: 'var(--success-light)', color: 'var(--success)',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', animation: 'pulseGlow 2s infinite' }} />
          SYSTEM LIVE
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
          background: 'var(--surface-alt)', color: 'var(--text-secondary)',
          border: '1px solid var(--border)'
        }}>
          {t('weather')}: LIVE
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Theme Toggle */}
        <button onClick={toggleTheme} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
          background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text)', cursor: 'pointer',
        }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Offline Mode */}
        <button onClick={handleOffline} style={{
          padding: '7px 14px', borderRadius: 'var(--radius-sm)', 
          border: `1px solid ${offlineMode ? 'var(--warning)' : 'var(--border)'}`,
          background: offlineMode ? 'var(--warning-light)' : 'var(--surface)',
          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          color: offlineMode ? 'var(--warning)' : 'var(--text-secondary)', 
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <WifiOff size={14} />
          <span className="desktop-only">Offline Map</span>
        </button>

        {/* SOS Emergency */}
        <button onClick={() => setEmergencyModalOpen(true)} style={{
          padding: '7px 14px', borderRadius: 'var(--radius-sm)', 
          border: '1px solid var(--danger)',
          background: 'var(--danger)', color: '#fff',
          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
          boxShadow: '0 0 0 0 rgba(220,53,69,0.4)',
          animation: 'emergencyPulse 2s infinite',
        }}>
          <AlertTriangle size={14} />
          <span className="desktop-only">SOS EMERGENCY</span>
        </button>
      </div>
    </header>
  );
}
