import Header from '@/components/layout/Header';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import NavPanel from '@/components/panels/NavPanel';
import DynamicMap from '@/components/map/DynamicMap';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import OfflineBanner from '@/components/ui/OfflineBanner';
import Notification from '@/components/ui/Notification';
import EmergencyModal from '@/components/ui/EmergencyModal';
import RouteSwitchModal from '@/components/ui/RouteSwitchModal';

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <LoadingOverlay />
      <Notification />
      <EmergencyModal />
      <RouteSwitchModal />
      <Header />
      <OfflineBanner />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftPanel />
        
        <div style={{ flex: 1, position: 'relative' }}>
          <DynamicMap />
          <NavPanel />
        </div>

        <RightPanel />
      </div>
    </main>
  );
}
