import { useState, useCallback } from 'react';

export type MapStyleOption = 'standard' | 'satellite' | 'infrastructure';

export type TimeframeOption = 'all' | '24h' | 'week';

export interface MapFilters {
  mapStyle: MapStyleOption;
  categories: {
    road: boolean;
    garbage: boolean;
    lighting: boolean;
    drainage: boolean;
    other: boolean;
  };
  showDropOffPoints: boolean;
  showResolved: boolean;
  timeframe: TimeframeOption;
}

const DEFAULT_FILTERS: MapFilters = {
  mapStyle: 'standard',
  categories: {
    road: true,
    garbage: true,
    lighting: true,
    drainage: true,
    other: true,
  },
  showDropOffPoints: false,
  showResolved: true,
  timeframe: 'all',
};

export function useMapFilters() {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [isLayerSheetOpen, setIsLayerSheetOpen] = useState(false);

  const toggleCategory = useCallback((category: keyof MapFilters['categories']) => {
    setFilters((prev) => {
      const nextValue = !prev.categories[category];
      return {
        ...prev,
        categories: { ...prev.categories, [category]: nextValue },
        showDropOffPoints: nextValue ? false : prev.showDropOffPoints,
      };
    });
  }, []);

  const toggleDropOffPoints = useCallback(() => {
    setFilters((prev) => {
      const nextValue = !prev.showDropOffPoints;
      return {
        ...prev,
        showDropOffPoints: nextValue,
        categories: nextValue
          ? { road: false, garbage: false, lighting: false, drainage: false, other: false }
          : { road: true, garbage: true, lighting: true, drainage: true, other: true },
      };
    });
  }, []);

  const setMapStyle = useCallback((mapStyle: MapStyleOption) => {
    setFilters((prev) => ({ ...prev, mapStyle }));
  }, []);

  const setShowResolved = useCallback((showResolved: boolean) => {
    setFilters((prev) => ({ ...prev, showResolved }));
  }, []);

  const setTimeframe = useCallback((timeframe: TimeframeOption) => {
    setFilters((prev) => ({ ...prev, timeframe }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    isLayerSheetOpen,
    setIsLayerSheetOpen,
    toggleCategory,
    toggleDropOffPoints,
    setMapStyle,
    setShowResolved,
    setTimeframe,
    resetFilters,
  };
}
