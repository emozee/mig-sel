import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

// Strict Sarpang Boundary Constraint
const SARPANG_BOUNDS = L.latLngBounds(
  [26.7032, 89.9213], // South-West Point
  [27.2401, 90.7235], // North-East Point
);

// Custom Marker styling factory using our design tokens
const createCustomIcon = (status: string) => {
  let markerColor = '#154212'; // Default primary forest green

  if (status === 'pending') markerColor = '#ba1a1a'; // Error / Critical Red
  if (status === 'in-progress') markerColor = '#2d5a27'; // Primary Container Green
  if (status === 'resolved') markerColor = '#55624f'; // Secondary Sage

  return L.divIcon({
    html: `<div style="
            background-color: ${markerColor}; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            border: 3px solid #ffffff; 
            box-shadow: 0px 2px 10px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background-color: #ffffff; border-radius: 50%;"></div>
          </div>`,
    className: 'custom-gps-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Mock data reflecting BA spec problem categories
const MOCK_GRIEVANCES = [
  {
    id: '1',
    title: 'Deep Pothole near Central Hospital',
    category: 'road',
    status: 'pending',
    lat: 26.9342,
    lng: 90.4785,
    desc: 'Deteriorating asphalt making transit dangerous for pregnant commuters.',
  },
  {
    id: '2',
    title: 'Flickering Streetlights on Sector 4 Path',
    category: 'lighting',
    status: 'in-progress',
    lat: 26.9295,
    lng: 90.4851,
    desc: 'Early failure signs along common late-night walking routes.',
  },
  {
    id: '3',
    title: 'Overflowing Trash Bins',
    category: 'garbage',
    status: 'resolved',
    lat: 26.9212,
    lng: 90.4699,
    desc: 'Waste buildup on outskirts cleared by municipal teams.',
  },
];

export const GrievanceMap = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredGrievances =
    activeFilter === 'all'
      ? MOCK_GRIEVANCES
      : MOCK_GRIEVANCES.filter((g) => g.category === activeFilter);

  return (
    <div className="w-full space-y-4">
      {/* Category filter bar similar to the Bonn platform layout */}
      <div className="flex flex-wrap gap-2 pb-2">
        {['all', 'road', 'garbage', 'lighting', 'drainage'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`text-label-sm rounded-full border px-3 py-1 font-bold tracking-wider uppercase transition-all ${
              activeFilter === cat
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="border-border group relative h-[550px] w-full overflow-hidden rounded-xl border shadow-sm">
        <MapContainer
          center={[26.9312, 90.4795]}
          zoom={13}
          minZoom={11}
          maxZoom={17}
          maxBounds={SARPANG_BOUNDS}
          maxBoundsViscosity={1.0}
          className="z-0 h-full w-full"
        >
          {/* Muted Voyager map tiles perfectly matching our dark charcoal & earth elements */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://gmc.gov.bt">GMC Resilience System</a>'
          />

          {filteredGrievances.map((grievance) => (
            <Marker
              key={grievance.id}
              position={[grievance.lat, grievance.lng]}
              icon={createCustomIcon(grievance.status)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="min-w-[200px] space-y-2 p-2 font-sans">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-label-lg text-on-surface leading-tight font-bold">
                      {grievance.title}
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        grievance.status === 'pending'
                          ? 'bg-error-container text-on-error-container'
                          : grievance.status === 'in-progress'
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      {grievance.status}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">
                    {grievance.desc}
                  </p>
                  <div className="border-outline-variant text-muted-foreground flex items-center justify-between border-t pt-1 text-[11px] font-medium">
                    <span>
                      Type:{' '}
                      <strong className="text-on-surface uppercase">{grievance.category}</strong>
                    </span>
                    <button className="text-primary font-bold hover:underline">
                      View Progress
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Live Status indicator overlay */}
        <div className="bg-surface/95 border-outline-variant absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
          <span className="text-label-xs text-on-surface font-bold tracking-wider uppercase">
            Active Gelephu Jurisdiction Geo-Fence
          </span>
        </div>
      </div>
    </div>
  );
};
