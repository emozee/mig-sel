import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { X } from 'lucide-react';

interface DirectionsControlProps {
  destination: { lat: number; lng: number; title: string };
  currentCoords: { lat: number; lng: number } | null;
  onClose: () => void;
}

export function DirectionsControl({ destination, currentCoords, onClose }: DirectionsControlProps) {
  const map = useMap();
  const controlRef = useRef<L.Routing.Control | null>(null);
  const destRef = useRef(destination);

  useEffect(() => {
    if (!map) return;

    const end = L.latLng(destination.lat, destination.lng);
    const start = currentCoords
      ? L.latLng(currentCoords.lat, currentCoords.lng)
      : L.latLng(destination.lat + 0.005, destination.lng + 0.005);

    const plan = L.Routing.plan([start, end], {
      createMarker: () => false,
      draggableWaypoints: false,
      addWaypoints: false,
    });

    const control = L.Routing.control({
      waypoints: [start, end],
      plan,
      routeWhileDragging: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
      autoRoute: true,
      lineOptions: {
        styles: [{ color: '#3b82f6', opacity: 0.85, weight: 5 }],
        extendToWaypoints: true,
        missingRouteStyles: [{ color: '#dc2626', opacity: 0.5, weight: 4, dashArray: '10, 10' }],
        missingRouteTolerance: 10,
      },
      router: new L.Routing.OSRMv1({
        language: 'en',
        profile: 'driving',
        suppressDemoServerWarning: true,
      }),
    }).addTo(map);

    controlRef.current = control;

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    destRef.current = destination;
  }, [destination]);

  useEffect(() => {
    if (!controlRef.current || !currentCoords) return;
    const end = L.latLng(destRef.current.lat, destRef.current.lng);
    const start = L.latLng(currentCoords.lat, currentCoords.lng);
    controlRef.current.setWaypoints([start, end]);
  }, [currentCoords]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1002] flex items-start justify-center pt-20">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-lg ring-1 ring-gray-200 transition-all">
        <span className="max-w-[200px] truncate text-sm font-semibold text-gray-800">
          {destination.title}
        </span>
        <button
          onClick={onClose}
          className="-mr-1 flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 active:scale-95"
          aria-label="Close directions"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
