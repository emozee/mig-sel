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
  if (code === 1) return 'permission_denied';
  if (code === 2) return 'position_unavailable';
  if (code === 3) return 'timeout';
  return null;
}

function getErrorMessage(code: number) {
  if (code === 1)
    return 'Location permission denied. Enable location access in your browser settings.';
  if (code === 2) return 'Location unavailable. Make sure GPS/location is turned on.';
  if (code === 3) return 'Location request timed out. Try again.';
  return 'Failed to detect location';
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
  const requestIdRef = useRef(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!geoAvailable) return;

    mountedRef.current = true;
    const requestId = ++requestIdRef.current;

    const loadingTimeout = setTimeout(() => {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
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
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      clearTimeout(loadingTimeout);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
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
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      clearTimeout(loadingTimeout);
      const errorType = getErrorType(err.code);
      setState((prev) =>
        prev.coords
          ? { ...prev, loading: false }
          : {
              coords: null,
              accuracy: null,
              error: getErrorMessage(err.code),
              errorType,
              loading: false,
            },
      );
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

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const requestId = ++requestIdRef.current;
    setState({ coords: null, accuracy: null, error: null, errorType: null, loading: true });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
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
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        const errorType = getErrorType(err.code);
        setState({
          coords: null,
          accuracy: null,
          error: getErrorMessage(err.code),
          errorType,
          loading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, [geoAvailable]);

  useEffect(() => {
    if (!geoAvailable) return;

    const retryWhenActive = () => {
      if (
        document.visibilityState === 'visible' &&
        !stateRef.current.coords &&
        !stateRef.current.loading
      ) {
        requestLocation();
      }
    };

    window.addEventListener('focus', retryWhenActive);
    document.addEventListener('visibilitychange', retryWhenActive);
    return () => {
      window.removeEventListener('focus', retryWhenActive);
      document.removeEventListener('visibilitychange', retryWhenActive);
    };
  }, [geoAvailable, requestLocation]);

  return {
    ...state,
    requestLocation,
    supported: geoAvailable,
    permissionDenied: state.errorType === 'permission_denied',
  };
};
