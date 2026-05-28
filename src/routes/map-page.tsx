import { GrievanceMap } from '@/features/auth/grievance/components/grievance-map';
import { MapDock } from '@/components/layout/map-dock';
import { FilterLayersSheet } from '@/features/auth/grievance/components/filter-layers-sheet';
import { useMapFilters } from '@/features/auth/grievance/hooks/use-map-filters';

export const MapPage = () => {
  const {
    filters,
    isLayerSheetOpen,
    setIsLayerSheetOpen,
    toggleCategory,
    toggleDropOffPoints,
    setMapStyle,
    setShowResolved,
    setTimeframe,
  } = useMapFilters();

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden font-sans">
      <GrievanceMap
        filters={filters}
        onToggleCategory={toggleCategory}
        onToggleDropOffPoints={toggleDropOffPoints}
        onOpenLayers={() => setIsLayerSheetOpen(true)}
      />
      <MapDock />
      <FilterLayersSheet
        open={isLayerSheetOpen}
        onOpenChange={setIsLayerSheetOpen}
        filters={filters}
        onMapStyleChange={setMapStyle}
        onShowResolvedChange={setShowResolved}
        onTimeframeChange={setTimeframe}
      />
    </div>
  );
};
