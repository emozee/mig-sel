import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useGrievances } from '../api/use-grievances';
import { useGeoLocation } from '../hooks/use-geo-location';
import { useSession } from '@/features/auth/api/use-session';
import {
  Search,
  Loader2,
  Navigation,
  Maximize2,
  Minimize2,
  ArrowRight,
  Link2,
  MapPin,
  Layers,
  Map as MapIcon,
  Satellite,
  Grid3x3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMapFilters, type MapFilters, type MapStyleOption } from '../hooks/use-map-filters';
import { DirectionsControl } from './directions-control';
import { ImageLightbox } from './image-lightbox';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router';

const SARPANG_BOUNDS = L.latLngBounds([26.7032, 89.9213], [27.2401, 90.7235]);
const DEFAULT_CENTER = { lat: 26.9312, lng: 90.4795 };

function categoryIcon(
  category: string,
  status: string,
  isMerged = false,
  isOwned = false,
): L.DivIcon {
  const colors: Record<string, string> = {
    road: '#d97706',
    garbage: '#2563eb',
    lighting: '#ca8a04',
    drainage: '#0891b2',
    other: '#154212',
    default: '#154212',
  };

  const color = colors[category] ?? colors.default;

  const icons: Record<string, string> = {
    road: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M2 12h3.5l1.5-4 4 8 3-6 2 4H22"/><path d="M2 20V4"/></svg>`,
    garbage: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`,
    lighting: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
    drainage: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M14 2v8a2 2 0 0 0 2 2h4"/><path d="M2 18h4a2 2 0 0 1 2 2v2"/><path d="M4 22h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H8a2 2 0 0 1-2-2V4"/></svg>`,
    other: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const svg = icons[category] ?? icons.other;

  const isResolved = status === 'resolved';
  const borderColor = isOwned ? '#3b82f6' : 'white';
  const borderWidth = isMerged ? '2px' : '3px';
  const borderStyle = isMerged ? 'dashed' : 'solid';
  const ringColor = isMerged ? '#a855f744' : `${color}44`;

  return L.divIcon({
    html: `<div style="
      position: relative;
      width: 40px;
      height: ${isOwned ? 52 : 40}px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        background: ${color};
        border-radius: 50%;
        border: ${borderWidth} ${borderStyle} ${borderColor};
        box-shadow: 0 3px 12px rgba(0,0,0,0.25), 0 0 0 2px ${ringColor};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
        ${isResolved ? 'opacity: 0.7; filter: saturate(0.5);' : ''}
      ">
        ${svg}
      </div>
      ${
        isMerged && !isResolved
          ? `<div style="
        position: absolute;
        bottom: 0px;
        left: 50%;
        transform: translateX(-50%);
        width: 14px;
        height: 14px;
        background: #a855f7;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 7px;
        color: white;
        font-weight: bold;
      ">⛓</div>`
          : !isResolved
            ? `<div style="
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        height: 8px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid white;
      "></div>`
            : ''
      }
      ${
        isOwned
          ? `<div style="
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        background: #3b82f6;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 2px #3b82f644;
      "></div>`
          : ''
      }
    </div>`,
    className: '',
    iconSize: [40, isOwned ? 52 : 48],
    iconAnchor: [20, isOwned ? 44 : 40],
    popupAnchor: [0, isOwned ? -46 : -42],
  });
}

function clusterIcon(count: number): L.DivIcon {
  const color =
    count <= 3 ? '#22c55e' : count <= 6 ? '#eab308' : count <= 10 ? '#f97316' : '#ef4444';

  const glow = color + '44';

  return L.divIcon({
    html: `<div style="
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 44px;
        height: 44px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 12px rgba(0,0,0,0.3), 0 0 0 3px ${glow};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 15px;
        font-family: system-ui, sans-serif;
      ">
        ${count}
      </div>
    </div>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

function ClusterPopup({
  grievances,
  lat,
  lng,
  onNavigate,
}: {
  grievances: Array<{
    id: string;
    title: string;
    category: string;
    mapStatus: string;
    desc: string;
    image_url: string;
    resolved_image_url?: string;
  }>;
  lat: number;
  lng: number;
  onNavigate: (lat: number, lng: number, title: string) => void;
}) {
  return (
    <div className="max-h-[300px] max-w-[260px] overflow-y-auto font-sans">
      <p className="sticky top-0 bg-white pb-1.5 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
        {grievances.length} reports at this location
      </p>
      <div className="space-y-2">
        {grievances.map((g) => (
          <div key={g.id} className="border-t border-gray-100 pt-2 first:border-t-0 first:pt-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm leading-tight font-semibold text-gray-900">{g.title}</h4>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                  g.mapStatus === 'pending'
                    ? 'bg-red-100 text-red-700'
                    : g.mapStatus === 'in-progress'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                {g.mapStatus === 'in-progress'
                  ? 'In Progress'
                  : g.mapStatus === 'pending'
                    ? 'Pending'
                    : 'Resolved'}
              </span>
            </div>

            {g.image_url && (
              <ImageLightbox
                src={g.image_url}
                alt=""
                className="mt-1.5 h-20 w-full rounded-lg object-cover"
              />
            )}

            {g.desc && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">{g.desc}</p>
            )}

            <div className="mt-1 text-[11px] font-medium text-gray-500">
              Category:{' '}
              <strong className="text-gray-800 uppercase">{categoryLabel(g.category)}</strong>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onNavigate(lat, lng, `${grievances.length} reports`)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
      >
        <Navigation className="h-3.5 w-3.5" />
        Directions to this location
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function mapStatus(status: string): string {
  if (status === 'submitted' || status === 'in_review') return 'pending';
  if (status === 'assigned' || status === 'in_progress') return 'in-progress';
  if (status === 'resolved' || status === 'closed') return 'resolved';
  return 'pending';
}

const CATEGORY_LABELS: Record<string, string> = {
  road: 'Road Damage',
  garbage: 'Waste Management',
  lighting: 'Street Lighting',
  drainage: 'Drainage/Sewage',
  other: 'Other',
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function SearchBox() {
  const map = useMap();
  return <MapSearch map={map} />;
}

function UserLocationDot({
  coords: detectedCoords,
  accuracy,
}: {
  coords: { lat: number; lng: number } | null;
  accuracy: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!detectedCoords) return;

    const layers: L.Layer[] = [];

    if (accuracy != null && accuracy > 0 && accuracy < 500) {
      const accCircle = L.circle([detectedCoords.lat, detectedCoords.lng], {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.25,
      }).addTo(map);
      layers.push(accCircle);
    }

    const dot = L.circleMarker([detectedCoords.lat, detectedCoords.lng], {
      radius: 10,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.4,
      weight: 3,
      opacity: 0.9,
    }).addTo(map);
    layers.push(dot);

    const pulse = L.circleMarker([detectedCoords.lat, detectedCoords.lng], {
      radius: 6,
      color: '#3b82f6',
      fillColor: '#60a5fa',
      fillOpacity: 0.8,
      weight: 2,
    }).addTo(map);
    layers.push(pulse);

    return () => {
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [detectedCoords, map, accuracy]);

  return null;
}

function UserMarker({ userLocation }: { userLocation: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) return;
    map.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true, duration: 1.5 });
  }, [userLocation, map]);

  const icon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `
          <div class="gps-marker">
            <div class="gps-ring" />
            <div class="gps-ring-delayed" />
            <div class="gps-dot" />
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [],
  );

  if (!userLocation) return null;

  return <Marker position={[userLocation.lat, userLocation.lng]} icon={icon} />;
}

function LocateButton({ coords: detectedCoords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const requestLocation = useCallback(() => {
    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 15, { duration: 1.5 });
        setLocating(false);
      },
      (err) => {
        if (!mountedRef.current) return;
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setShowPermissionDialog(true);
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('GPS/location unavailable. Make sure location is turned on.');
        } else {
          setError('Location request timed out. Try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }, [map]);

  const handleLocate = useCallback(() => {
    setError(null);
    setShowPermissionDialog(false);

    if (detectedCoords) {
      map.flyTo([detectedCoords.lat, detectedCoords.lng], 15, { duration: 1.5 });
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      return;
    }

    requestLocation();
  }, [map, detectedCoords, requestLocation]);

  const handleDismissPermissionDialog = useCallback(() => {
    setShowPermissionDialog(false);
  }, []);

  return (
    <div className="absolute right-4 bottom-32 z-[1000]">
      {error && (
        <div
          onClick={() => setError(null)}
          className="absolute right-0 bottom-full mb-2 max-w-[220px] cursor-pointer rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm ring-1 ring-red-200"
        >
          {error}
        </div>
      )}
      <button
        onClick={handleLocate}
        disabled={locating}
        title="My Location"
        aria-label="My Location"
        className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-gray-200/60 transition-all hover:bg-gray-50 active:scale-95 disabled:cursor-wait disabled:opacity-50"
      >
        {locating ? (
          <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-gray-700"
          >
            <line x1="12" x2="12" y1="2" y2="6" />
            <line x1="12" x2="12" y1="18" y2="22" />
            <line x1="2" x2="6" y1="12" y2="12" />
            <line x1="18" x2="22" y1="12" y2="12" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        )}
      </button>

      <DialogRoot open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Turn on location</DialogTitle>
            <DialogDescription>
              Your location is currently turned off. Enable GPS/location on your device, then allow
              location access when prompted by your browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={handleDismissPermissionDialog}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

function MapSearch({ map }: { map: L.Map }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prevQueryRef = useRef('');

  useEffect(() => {
    if (!query.trim() || query.trim().length < 3) {
      if (prevQueryRef.current !== query) {
        setIsSearching(false);
      }
      prevQueryRef.current = query;
      return;
    }

    prevQueryRef.current = query;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=5&countrycodes=BT`,
          { headers: { 'Accept-Language': 'en' } },
        );
        if (!res.ok) return;
        const data: SearchResult[] = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    map.flyTo([lat, lng], 16, { duration: 1.2 });
    setQuery(result.display_name.split(',')[0]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-lg ring-1 ring-gray-200/60 backdrop-blur-md">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search places in Sarpang..."
          className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute right-0 left-0 z-[1001] mt-1 max-h-60 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-gray-200/60">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(result)}
              className="flex w-full items-start gap-2 border-b border-gray-100 px-3 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-gray-50"
            >
              <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="line-clamp-2 text-gray-700">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FullscreenButton({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onchange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onchange);
    return () => document.removeEventListener('fullscreenchange', onchange);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-md ring-1 ring-gray-200/50 backdrop-blur-md transition-all hover:bg-white active:scale-95"
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? (
        <Minimize2 className="h-4 w-4 text-gray-700" />
      ) : (
        <Maximize2 className="h-4 w-4 text-gray-700" />
      )}
    </button>
  );
}

function MapInit() {
  const map = useMap();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    requestAnimationFrame(() => {
      map.invalidateSize();
    });
  }, [map]);

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      const numLat = Number.parseFloat(lat);
      const numLng = Number.parseFloat(lng);
      if (!Number.isNaN(numLat) && !Number.isNaN(numLng)) {
        map.flyTo([numLat, numLng], 16, { duration: 1.2 });
      }
    }
  }, [map, searchParams]);

  return null;
}

function ScaleControl() {
  const map = useMap();

  useEffect(() => {
    const scale = L.control.scale({
      position: 'bottomleft',
      imperial: false,
      metric: true,
    });
    scale.addTo(map);
    return () => {
      scale.remove();
    };
  }, [map]);

  return null;
}

const CATEGORY_CHIPS: { key: keyof MapFilters['categories']; label: string; color: string }[] = [
  { key: 'road', label: 'Road', color: '#d97706' },
  { key: 'garbage', label: 'Waste', color: '#2563eb' },
  { key: 'lighting', label: 'Lighting', color: '#ca8a04' },
  { key: 'drainage', label: 'Drainage', color: '#0891b2' },
  { key: 'other', label: 'Other', color: '#154212' },
];

function CategoryFilterChips({
  filters,
  onToggleCategory,
  onToggleDropOffPoints,
}: {
  filters: MapFilters;
  onToggleCategory: (category: keyof MapFilters['categories']) => void;
  onToggleDropOffPoints: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const onDown = (clientX: number) => {
    const s = stateRef.current;
    s.isDown = true;
    s.moved = false;
    s.startX = clientX - (containerRef.current?.offsetLeft ?? 0);
    s.scrollLeft = containerRef.current?.scrollLeft ?? 0;
  };

  const onMove = (clientX: number) => {
    const s = stateRef.current;
    if (!s.isDown || !containerRef.current) return;
    const x = clientX - containerRef.current.offsetLeft;
    const dx = x - s.startX;
    if (Math.abs(dx) > 5) s.moved = true;
    containerRef.current.scrollLeft = s.scrollLeft - dx;
  };

  const onUp = () => {
    stateRef.current.isDown = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => onDown(e.clientX)}
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={(e) => {
        e.stopPropagation();
        onDown(e.touches[0].clientX);
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        onMove(e.touches[0].clientX);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        onUp();
      }}
      className="absolute inset-x-0 top-16 z-[1000] cursor-grab [scrollbar-width:none] overflow-x-auto overscroll-x-contain px-3 select-none [-ms-overflow-style:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
    >
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleDropOffPoints}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition-all active:scale-95 ${
            filters.showDropOffPoints
              ? 'bg-emerald-600 text-white ring-transparent'
              : 'bg-white text-gray-600 ring-gray-200/60 hover:bg-gray-50'
          }`}
        >
          <MapPin className="h-3 w-3" />
          Drop Off
        </button>
        <div className="mx-1 h-5 w-px shrink-0 bg-gray-300" />
        {CATEGORY_CHIPS.map(({ key, label, color }) => {
          const isActive = filters.categories[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (stateRef.current.moved) return;
                onToggleCategory(key);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition-all active:scale-95 ${
                isActive
                  ? 'text-white ring-transparent'
                  : 'bg-white text-gray-600 ring-gray-200/60 hover:bg-gray-50'
              }`}
              style={isActive ? { backgroundColor: color, borderColor: 'transparent' } : undefined}
            >
              <span
                className={`h-2 w-2 rounded-full ${isActive ? 'bg-white/80' : ''}`}
                style={!isActive ? { backgroundColor: color } : undefined}
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GrievanceMarkers({
  grievances,
  allGrievances,
  currentUserId,
  onDirectionsTarget,
}: {
  grievances: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    mapStatus: string;
    lat: number;
    lng: number;
    desc: string;
    image_url: string;
    resolved_image_url?: string;
    parent_id: string | null;
    reporter_id: string;
  }>;
  allGrievances: Array<{ id: string; title: string; parent_id: string | null }>;
  currentUserId: string | undefined;
  onDirectionsTarget: (lat: number, lng: number, title: string) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  const precision = useMemo(() => {
    const lat = 26.9312;
    const mpp = (156543.03 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
    const clusterMeters = mpp * 30;
    return Math.max(1, Math.min(6, Math.round(Math.log10(111320 / clusterMeters))));
  }, [zoom]);

  const childrenMap = useMemo(() => {
    const map = new Map<string, typeof allGrievances>();
    for (const g of allGrievances) {
      if (g.parent_id) {
        const existing = map.get(g.parent_id);
        if (existing) existing.push(g);
        else map.set(g.parent_id, [g]);
      }
    }
    return map;
  }, [allGrievances]);

  const findParentTitle = (parentId: string) => {
    return allGrievances.find((g) => g.id === parentId)?.title || 'Unknown';
  };

  const grouped = useMemo(() => {
    const map_ = new Map<string, typeof grievances>();
    for (const g of grievances) {
      const latStr = g.lat.toFixed(precision);
      const lngStr = g.lng.toFixed(precision);
      const key = `${latStr},${lngStr}`;
      const existing = map_.get(key);
      if (existing) {
        existing.push(g);
      } else {
        map_.set(key, [g]);
      }
    }
    return map_;
  }, [grievances, precision]);

  return Array.from(grouped.entries()).map(([key, items]) => {
    if (items.length === 1) {
      const g = items[0];
      const isMerged = !!g.parent_id;
      const isOwned = currentUserId === g.reporter_id;
      const parentTitle = g.parent_id ? findParentTitle(g.parent_id) : null;
      const children = childrenMap.get(g.id);

      return (
        <Marker
          key={g.id}
          position={[g.lat, g.lng]}
          icon={categoryIcon(g.category, g.mapStatus, isMerged, isOwned)}
        >
          <Popup>
            <div className="max-w-[250px] font-sans">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm leading-tight font-semibold text-gray-900">{g.title}</h4>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                    g.mapStatus === 'pending'
                      ? 'bg-red-100 text-red-700'
                      : g.mapStatus === 'in-progress'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {g.mapStatus === 'in-progress'
                    ? 'In Progress'
                    : g.mapStatus === 'pending'
                      ? 'Pending'
                      : 'Resolved'}
                </span>
              </div>

              {isMerged && parentTitle && (
                <div
                  className="mt-2 rounded-lg border border-dashed px-2.5 py-1.5"
                  style={{ borderColor: '#a855f7', backgroundColor: '#faf5ff' }}
                >
                  <p className="text-[10px] leading-tight font-medium" style={{ color: '#a855f7' }}>
                    ⛓ This report has been linked as a duplicate of{' '}
                    <span className="font-semibold">{parentTitle}</span>
                  </p>
                </div>
              )}

              {isOwned && !isMerged && (
                <div
                  className="mt-2 rounded-lg px-2.5 py-1.5"
                  style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}
                >
                  <p className="text-[10px] leading-tight font-medium text-blue-600">
                    ● Your report
                  </p>
                </div>
              )}

              {isOwned && isMerged && !childrenMap.has(g.id) && (
                <div
                  className="mt-2 rounded-lg border border-dashed px-2.5 py-1.5"
                  style={{ borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}
                >
                  <p className="text-[10px] leading-tight font-medium text-amber-600">
                    ⛓ Your photo has been merged — another report with better evidence was used as
                    the master complaint
                  </p>
                </div>
              )}

              {children && children.length > 0 && (
                <div
                  className="mt-2 rounded-lg px-2.5 py-1.5"
                  style={{ backgroundColor: '#fefce8', border: '1px solid #fde68a' }}
                >
                  <p className="text-[10px] leading-tight font-medium text-amber-700">
                    <Link2 className="mr-0.5 inline h-3 w-3" />
                    Contains {children.length} linked duplicate{children.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {g.image_url && (
                <ImageLightbox
                  src={g.image_url}
                  alt="Complaint"
                  className="mt-2 h-32 w-full rounded-lg object-cover"
                />
              )}

              {g.resolved_image_url && g.mapStatus === 'resolved' && (
                <div className="mt-2">
                  <p className="text-[10px] font-bold tracking-wider text-green-600 uppercase">
                    Resolved — Before / After
                  </p>
                  <div className="mt-1 flex gap-1">
                    <ImageLightbox
                      src={g.image_url}
                      alt="Before"
                      className="h-20 w-1/2 rounded-lg object-cover ring-1 ring-gray-200"
                    />
                    <ImageLightbox
                      src={g.resolved_image_url}
                      alt="After"
                      className="h-20 w-1/2 rounded-lg object-cover ring-1 ring-green-300"
                    />
                  </div>
                </div>
              )}

              <p className="mt-2 text-xs leading-relaxed text-gray-600">{g.desc}</p>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-[11px] font-medium text-gray-500">
                <span>
                  Category:{' '}
                  <strong className="text-gray-800 uppercase">{categoryLabel(g.category)}</strong>
                </span>
              </div>
              {g.lat !== DEFAULT_CENTER.lat && g.lng !== DEFAULT_CENTER.lng && (
                <button
                  onClick={() => {
                    map.closePopup();
                    onDirectionsTarget(g.lat, g.lng, g.title);
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Directions
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      );
    }

    return (
      <Marker key={key} position={[items[0].lat, items[0].lng]} icon={clusterIcon(items.length)}>
        <Tooltip>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-gray-900">
              {items.length} reports at this location
            </p>
            {items.map((g) => (
              <p key={g.id} className="text-xs text-gray-600">
                • {g.title || 'Untitled'}
              </p>
            ))}
          </div>
        </Tooltip>
        <Popup>
          <ClusterPopup
            grievances={items}
            lat={items[0].lat}
            lng={items[0].lng}
            onNavigate={(lat, lng, title) => onDirectionsTarget(lat, lng, title)}
          />
        </Popup>
      </Marker>
    );
  });
}

interface GrievanceMapProps {
  filters?: MapFilters;
  userLocation?: { lat: number; lng: number } | null;
  onToggleCategory?: (category: keyof MapFilters['categories']) => void;
  onToggleDropOffPoints?: () => void;
}

export const GrievanceMap = ({
  filters: filtersProp,
  userLocation = null,
  onToggleCategory: onToggleCategoryProp,
  onToggleDropOffPoints: onToggleDropOffPointsProp,
}: GrievanceMapProps) => {
  const defaultFilters = useMapFilters();
  const filters = filtersProp ?? defaultFilters.filters;
  const onToggleCategory = onToggleCategoryProp ?? defaultFilters.toggleCategory;
  const onToggleDropOffPoints = onToggleDropOffPointsProp ?? defaultFilters.toggleDropOffPoints;
  const [directionsTarget, setDirectionsTarget] = useState<{
    lat: number;
    lng: number;
    title: string;
  } | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { coords: detectedCoords, accuracy } = useGeoLocation();
  const { data: session } = useSession();
  const { data: grievances, isLoading, isError, error } = useGrievances();
  const currentUserId = session?.user?.id;

  const mappedGrievances = (grievances ?? []).map((g) => ({
    id: g.id,
    title: g.title,
    category: g.category,
    status: g.status,
    mapStatus: mapStatus(g.status),
    lat: g.latitude === 0 && g.longitude === 0 ? DEFAULT_CENTER.lat : g.latitude,
    lng: g.longitude === 0 && g.longitude === 0 ? DEFAULT_CENTER.lng : g.longitude,
    desc: g.description,
    image_url: g.image_url,
    resolved_image_url: g.resolved_image_url,
    parent_id: g.parent_id,
    reporter_id: g.reporter_id,
    created_at: g.created_at,
  }));

  const [cutoffs] = useState(() => {
    const now = Date.now();
    return {
      cutoff24h: now - 24 * 60 * 60 * 1000,
      cutoffWeek: now - 7 * 24 * 60 * 60 * 1000,
    };
  });

  const filteredGrievances = mappedGrievances.filter((g) => {
    const cat = g.category as keyof typeof filters.categories;
    if (!filters.categories[cat]) return false;

    if (!filters.showResolved && (g.status === 'resolved' || g.status === 'closed')) {
      return false;
    }

    if (filters.timeframe !== 'all') {
      const created = new Date(g.created_at).getTime();
      if (filters.timeframe === '24h' && created < cutoffs.cutoff24h) return false;
      if (filters.timeframe === 'week' && created < cutoffs.cutoffWeek) return false;
    }

    return true;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layerRef.current && !layerRef.current.contains(e.target as Node)) {
        setShowLayers(false);
      }
    };
    if (showLayers) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLayers]);

  const handleMapStyleChange = (style: MapStyleOption) => {
    defaultFilters.setMapStyle(style);
    setShowLayers(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={mapContainerRef} className="group relative w-full flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-white/60">
            <p className="text-sm font-medium text-gray-500">Loading reports...</p>
          </div>
        )}

        {isError && (
          <div className="absolute top-4 left-4 z-[1001] rounded-xl bg-red-50 px-4 py-2 text-xs text-red-700 shadow-sm ring-1 ring-red-200">
            Failed to load reports. {error?.message}
          </div>
        )}

        <MapContainer
          center={[26.9312, 90.4795]}
          zoom={13}
          minZoom={11}
          maxZoom={21}
          maxBounds={SARPANG_BOUNDS}
          maxBoundsViscosity={1.0}
          className="z-10 h-full w-full bg-gray-100"
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
          preferCanvas={true}
        >
          <MapInit />
          <ScaleControl />

          {filters.mapStyle === 'standard' ? (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://www.google.com/maps">Google</a>'
              maxZoom={22}
            />
          ) : filters.mapStyle === 'satellite' ? (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://www.google.com/maps">Google</a>'
              maxZoom={22}
            />
          ) : (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://www.google.com/maps">Google</a>'
              maxZoom={22}
            />
          )}

          <div className="absolute top-4 left-3 z-[1002] w-[calc(100%-5rem)] max-w-xs sm:left-4 sm:max-w-sm">
            <SearchBox />
          </div>

          <CategoryFilterChips
            filters={filters}
            onToggleCategory={onToggleCategory}
            onToggleDropOffPoints={onToggleDropOffPoints}
          />

          <UserLocationDot coords={detectedCoords} accuracy={accuracy} />

          <UserMarker userLocation={userLocation} />

          <LocateButton coords={detectedCoords} />

          <div ref={layerRef} className="absolute top-36 right-4 z-[1000]">
            <button
              onClick={() => setShowLayers((v) => !v)}
              title="Map Layers"
              aria-label="Map Layers"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-gray-200/60 transition-all hover:bg-gray-50 active:scale-95"
            >
              <Layers className="h-5 w-5 text-gray-700" />
            </button>
            {showLayers && (
              <div className="absolute top-10 right-0 w-44 rounded-xl bg-white p-2 shadow-xl ring-1 ring-gray-200/60">
                <p className="text-muted-foreground mb-1.5 px-2 text-[10px] font-bold tracking-wider uppercase">
                  Map Layers
                </p>
                <div className="space-y-0.5">
                  {(
                    [
                      { key: 'standard' as const, label: 'Standard View', icon: MapIcon },
                      { key: 'satellite' as const, label: 'Satellite View', icon: Satellite },
                      {
                        key: 'infrastructure' as const,
                        label: 'Infrastructure View',
                        icon: Grid3x3,
                      },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => handleMapStyleChange(key)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all',
                        filters.mapStyle === key
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-gray-100',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {directionsTarget && (
            <DirectionsControl
              destination={directionsTarget}
              currentCoords={detectedCoords}
              onClose={() => setDirectionsTarget(null)}
            />
          )}

          <GrievanceMarkers
            grievances={filteredGrievances}
            allGrievances={mappedGrievances}
            currentUserId={currentUserId}
            onDirectionsTarget={(lat, lng, title) => setDirectionsTarget({ lat, lng, title })}
          />

          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/[0.03]" />

          <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 md:gap-2">
            <div className="hidden items-center gap-1.5 rounded-xl bg-white/90 px-2 py-1.5 text-[10px] font-bold tracking-wide text-gray-700 shadow-sm ring-1 ring-gray-200/50 backdrop-blur-md sm:flex md:gap-2 md:px-3 md:py-2 md:text-xs">
              <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 md:h-2 md:w-2" />
              </span>
              Live
            </div>
            <FullscreenButton containerRef={mapContainerRef} />
          </div>

          <div className="absolute right-4 bottom-4 z-[1000] flex items-center gap-1 rounded-xl bg-white/90 px-2 py-1.5 text-[9px] font-bold tracking-wider text-gray-500 shadow-sm ring-1 ring-gray-200/50 backdrop-blur-md md:gap-1.5 md:px-3 md:py-2 md:text-[10px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {detectedCoords
              ? `${detectedCoords.lat.toFixed(4)}, ${detectedCoords.lng.toFixed(4)}`
              : 'Sarpang, Bhutan'}
          </div>
        </MapContainer>
      </div>
    </div>
  );
};
