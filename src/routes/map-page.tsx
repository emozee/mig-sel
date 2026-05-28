import { GrievanceMap } from '@/features/auth/grievance/components/grievance-map';
import { MapDock } from '@/components/layout/map-dock';

export const MapPage = () => {
  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden font-sans">
      <GrievanceMap />
      <MapDock />
    </div>
  );
};
