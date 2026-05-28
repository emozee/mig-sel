import { useState, useEffect, useRef, useCallback } from 'react';

export type GeoLocationErrorType = 'permission_denied' | 'position_unavailable' | 'timeout' | null;

interface GeoLocationState {
  coords: { lat: number; lng: number } | null;
  accuracy: number | null;
  error: string | null;
  errorType: GeoLocationErrorType;
  loading: boolean;
}

const LOADING_TIMEOUT_MS = 12_000;

function getCachedPosition(): { lat: number; lng: number } | null {
  try {
    const cached = sessionStorage.getItem('migsel-location');
    if (cached) return JSON.parse(cached) as { lat: number; lng: number };
  } catch {
    /* ignore */
  }
  return null;
}

function setCachedPosition(lat: number, lng: number) {
  try {
    sessionStorage.setItem('migsel-location', JSON.stringify({ lat, lng }));
  } catch {
    /* ignore */
  }
}

function getErrorType(code: number): GeoLocationErrorType {
  if (code === GeolocationPositionError.PERMISSION_DENIED) return 'permission_denied';
  if (code === GeolocationPositionError.POSITION_UNAVAILABLE) return 'position_unavailable';
  if (code === GeolocationPositionError.TIMEOUT) return 'timeout';
  return null;
}
export const useGeoLocation = () => {
  const geoAvailable = typeof navigator !== 'undefined' && !!navigator.geolocation;

  const cached = geoAvailable ? getCachedPosition() : null;

  const [state, setState] = useState<GeoLocationState>({
    coords: cached,
    accuracy: null,
    error: geoAvailable ? null : 'Geolocation is not supported by your browser',
    errorType: null,
    loading: geoAvailable && !cached,
  });

  const watchIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!geoAvailable) return;

    mountedRef.current = true;

    const loadingTimeout = setTimeout(() => {
      if (!mountedRef.current) return;
      setState((prev) => {
        if (prev.loading) {
          return {
            coords: null,
            accuracy: null,
            error: 'Location detection timed out. Try again.',
            errorType: 'timeout' as const,
            loading: false,
          };
        }
        return prev;
      });
    }, LOADING_TIMEOUT_MS);

    const success = (position: GeolocationPosition) => {
      if (!mountedRef.current) return;
      clearTimeout(loadingTimeout);
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCachedPosition(coords.lat, coords.lng);
      setState({
        coords,
        accuracy: position.coords.accuracy,
        error: null,
        errorType: null,
        loading: false,
      });
    };

    const error = (err: GeolocationPositionError) => {
      if (!mountedRef.current) return;
      clearTimeout(loadingTimeout);
      const errorType = getErrorType(err.code);
      let message = 'Failed to detect location';
      if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
        message = 'Location permission denied. Enable location access in your browser settings.';
      } else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
        message = 'Location unavailable. Make sure GPS/location is turned on.';
      } else if (err.code === GeolocationPositionError.TIMEOUT) {
        message = 'Location request timed out. Try again.';
      }
      setState({ coords: null, accuracy: null, error: message, errorType, loading: false });
    };

    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
    watchIdRef.current = watchId;

    return () => {
      mountedRef.current = false;
      clearTimeout(loadingTimeout);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocation = useCallback(() => {
    if (!geoAvailable) return;

    setState({ coords: null, accuracy: null, error: null, errorType: null, loading: true });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCachedPosition(coords.lat, coords.lng);
        setState({
          coords,
          accuracy: position.coords.accuracy,
          error: null,
          errorType: null,
          loading: false,
        });
      },
      (err) => {
        if (!mountedRef.current) return;
        const errorType = getErrorType(err.code);
        let message = 'Failed to detect location';
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          message = 'Location permission denied. Enable location access in your browser settings.';
        } else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
          message = 'Location unavailable. Make sure GPS/location is turned on.';
        } else if (err.code === GeolocationPositionError.TIMEOUT) {
          message = 'Location request timed out. Try again.';
        }
        setState({ coords: null, accuracy: null, error: message, errorType, loading: false });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [geoAvailable]);

  return { ...state, requestLocation, permissionDenied: state.errorType === 'permission_denied' };
};
