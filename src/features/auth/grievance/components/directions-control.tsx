import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { X, Car, Footprints, ListOrdered } from 'lucide-react';

interface DirectionsControlProps {
  destination: { lat: number; lng: number; title: string };
  currentCoords: { lat: number; lng: number } | null;
  onClose: () => void;
}

type TravelMode = 'driving' | 'walking';

let audioCtx: AudioContext | null = null;

function playChime() {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
  } catch {
    // audio not available
  }
}

function createRouter(mode: TravelMode) {
  return new L.Routing.OSRMv1({
    language: 'en',
    profile: mode,
    suppressDemoServerWarning: true,
  });
}

interface Instruction {
  text: string;
  distance: number;
  time: number;
  index: number;
  streetName: string;
  direction: string;
  maneuver: string;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function DirectionsControl({ destination, currentCoords, onClose }: DirectionsControlProps) {
  const map = useMap();
  const controlRef = useRef<L.Routing.Control | null>(null);
  const [mode, setMode] = useState<TravelMode>('driving');
  const [showSteps, setShowSteps] = useState(false);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const prevStepIndexRef = useRef(0);
  const instructionsRef = useRef<Instruction[]>([]);

  const setupRoute = useCallback(
    (travelMode: TravelMode) => {
      if (!map) return;

      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }

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
        showAlternatives: true,
        fitSelectedRoutes: true,
        autoRoute: true,
        lineOptions: {
          styles: [{ color: '#3b82f6', opacity: 0.85, weight: 5 }],
          extendToWaypoints: true,
          missingRouteStyles: [{ color: '#dc2626', opacity: 0.5, weight: 4, dashArray: '10, 10' }],
          missingRouteTolerance: 10,
        },
        router: createRouter(travelMode),
      }).addTo(map);

      control.on('routesfound', (e: { routes: Array<{ instructions: Instruction[] }> }) => {
        const route = e.routes[0];
        if (route?.instructions) {
          instructionsRef.current = route.instructions;
          setInstructions(route.instructions);
          setCurrentStepIndex(0);
          prevStepIndexRef.current = 0;
        }
      });

      controlRef.current = control;
    },
    [map, destination, currentCoords],
  );

  useEffect(() => {
    setupRoute(mode);

    const timer = setTimeout(() => {
      const container = document.querySelector('.leaflet-routing-container') as HTMLElement | null;
      if (container) {
        container.style.display = 'none';
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map, destination, mode, setupRoute]);

  useEffect(() => {
    if (!controlRef.current || !currentCoords) return;
    const end = L.latLng(destination.lat, destination.lng);
    const start = L.latLng(currentCoords.lat, currentCoords.lng);
    controlRef.current.setWaypoints([start, end]);
  }, [currentCoords, destination]);

  useEffect(() => {
    const container = document.querySelector('.leaflet-routing-container') as HTMLElement | null;
    if (container) {
      container.style.display = showSteps ? '' : 'none';
    }
  }, [showSteps]);

  useEffect(() => {
    if (!currentCoords || instructionsRef.current.length === 0) return;

    const control = controlRef.current;
    if (!control) return;

    const userLatLng = L.latLng(currentCoords.lat, currentCoords.lng);
    let stepIdx = 0;
    const insts = instructionsRef.current;

    const route = (control as unknown as { _route?: { coordinates: L.LatLng[] } })._route;
    if (route?.coordinates) {
      const coords = route.coordinates;
      let closestCoordIdx = 0;
      let closestDist = Infinity;
      for (let i = 0; i < coords.length; i++) {
        const d = userLatLng.distanceTo(coords[i]);
        if (d < closestDist) {
          closestDist = d;
          closestCoordIdx = i;
        }
      }

      for (let i = insts.length - 1; i >= 0; i--) {
        if (insts[i].index != null && closestCoordIdx >= insts[i].index) {
          stepIdx = i;
          break;
        }
      }
    }

    if (stepIdx !== prevStepIndexRef.current) {
      prevStepIndexRef.current = stepIdx;
      playChime();
    }

    setCurrentStepIndex(stepIdx);
  }, [currentCoords]);

  const handleModeChange = useCallback((newMode: TravelMode) => {
    setMode(newMode);
  }, []);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[1002] flex items-start justify-center pt-20">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-lg ring-1 ring-gray-200 transition-all">
          <div className="mr-1 flex overflow-hidden rounded-lg border border-gray-200">
            <button
              onClick={() => handleModeChange('driving')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-all ${
                mode === 'driving' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
              aria-label="Driving directions"
            >
              <Car className="h-3.5 w-3.5" />
              Car
            </button>
            <button
              onClick={() => handleModeChange('walking')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-all ${
                mode === 'walking' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
              aria-label="Walking directions"
            >
              <Footprints className="h-3.5 w-3.5" />
              Walk
            </button>
          </div>
          <span className="max-w-[140px] truncate text-sm font-semibold text-gray-800 sm:max-w-[200px]">
            {destination.title}
          </span>
          <button
            onClick={() => setShowSteps((v) => !v)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-95 ${
              showSteps
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
            aria-label={showSteps ? 'Hide steps' : 'Show steps'}
            title={showSteps ? 'Hide steps' : 'Show steps'}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="-mr-1 flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 active:scale-95"
            aria-label="Close directions"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showSteps && instructions.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-[1003] flex items-center justify-center p-4">
          <div className="pointer-events-auto max-h-[70vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white/70 shadow-2xl ring-1 ring-gray-200 backdrop-blur-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100/50 bg-white/70 px-4 py-3 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-gray-800">Directions</h3>
              <button
                onClick={() => setShowSteps(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              {instructions.map((inst, i) => {
                const isCompleted = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 border-l-2 px-3 py-2.5 transition-all ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50'
                        : isCompleted
                          ? 'border-gray-200 opacity-40'
                          : 'border-gray-200'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-green-100 text-green-700'
                          : isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent
                            ? 'text-blue-900'
                            : isCompleted
                              ? 'text-gray-400'
                              : 'text-gray-700'
                        }`}
                      >
                        {inst.text || inst.streetName || 'Continue'}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {inst.distance != null && formatDistance(inst.distance)}
                        {inst.distance != null && inst.time != null ? ' · ' : ''}
                        {inst.time != null ? `${Math.round(inst.time / 60)} min` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
