import { Marker, Popup, useMap } from 'react-leaflet';
import { Navigation, ArrowRight } from 'lucide-react';
import L from 'leaflet';
import { dropOffPoints } from '../data/drop-off-points';

const DROP_OFF_COLOR = '#059669';

function dropOffIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 36px;
        height: 36px;
        background: ${DROP_OFF_COLOR};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 12px rgba(0,0,0,0.25), 0 0 0 2px ${DROP_OFF_COLOR}44;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <path d="M3 6h18"/>
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        </svg>
      </div>
    </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
  });
}

export function DropOffMarkers({
  onDirectionsTarget,
}: {
  onDirectionsTarget: (lat: number, lng: number, title: string) => void;
}) {
  const map = useMap();

  if (dropOffPoints.length === 0) return null;

  return (
    <>
      {dropOffPoints.map((point) => (
        <Marker key={point.id} position={[point.lat, point.lng]} icon={dropOffIcon()}>
          <Popup>
            <div className="max-w-[220px] font-sans">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: DROP_OFF_COLOR }}
                />
                <h4 className="text-sm font-semibold text-gray-900">{point.name}</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">Waste drop-off point</p>
              <p className="mt-1 text-[10px] text-gray-400">
                Lat: {point.lat.toFixed(6)}, Lng: {point.lng.toFixed(6)}
              </p>
              <button
                onClick={() => {
                  map.closePopup();
                  onDirectionsTarget(point.lat, point.lng, point.name);
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
              >
                <Navigation className="h-3.5 w-3.5" />
                Directions
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
