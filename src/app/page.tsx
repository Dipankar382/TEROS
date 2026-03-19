import Header from '@/components/layout/Header';
import LeftPanel from '@/components/panels/LeftPanel';
import NavPanel from '@/components/panels/NavPanel';
import DynamicMap from '@/components/map/DynamicMap';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import OfflineBanner from '@/components/ui/OfflineBanner';
import Notification from '@/components/ui/Notification';
import EmergencyModal from '@/components/ui/EmergencyModal';
import RouteSwitchModal from '@/components/ui/RouteSwitchModal';
import MissionTelemetryOverlay from '@/components/ui/MissionTelemetryOverlay';

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <LoadingOverlay />
      <Notification />
      <EmergencyModal />
      <RouteSwitchModal />
      <Header />
      <OfflineBanner />
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <DynamicMap />
        </div>
        
        <MissionTelemetryOverlay />

        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, pointerEvents: 'none', display: 'flex', width: '100%', zIndex: 10 }}>
          <div style={{ pointerEvents: 'auto', display: 'flex', height: '100%' }}>
            <LeftPanel />
          </div>
        </div>
        
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 20 }}>
          <div style={{ pointerEvents: 'auto' }}>
            <NavPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
