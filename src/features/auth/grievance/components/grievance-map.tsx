import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Strict Geo-Fence bounding box parameters for Sarpang Dzongkhag
const SARPANG_BOUNDS = L.latLngBounds(
  [26.7032, 89.9213], // South-West Boundary
  [27.2401, 90.7235], // North-East Boundary
);

export const GrievanceMap = () => {
  return (
    <div className="border-border relative h-[550px] w-full overflow-hidden rounded-xl border shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
      <MapContainer
        center={[26.9312, 90.4795]} // Lat/Lng Centered directly onto Gelephu
        zoom={13}
        minZoom={11}
        maxZoom={18}
        maxBounds={SARPANG_BOUNDS}
        maxBoundsViscosity={1.0} // Prevents shifting panning momentum past the bounds
        className="z-0 h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://gmc.gov.bt">GMC Resilience System</a>'
        />
      </MapContainer>

      {/* Visual Indicator of localized tracking */}
      <div className="bg-card/90 border-outline/30 absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
        <span className="text-label-sm text-on-surface font-bold tracking-wider uppercase">
          Sarpang Dzongkhag Coverage Area
        </span>
      </div>
    </div>
  );
};
