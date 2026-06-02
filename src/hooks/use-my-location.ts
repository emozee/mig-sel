import { useState, useCallback, useRef, useEffect } from 'react';

export interface MyLocationState {
  userLocation: { lat: number; lng: number } | null;
  isLocating: boolean;
  error: string | null;
}

export const useMyLocation = () => {
  const [state, setState] = useState<MyLocationState>({
    userLocation: null,
    isLocating: false,
    error: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        userLocation: null,
        isLocating: false,
        error: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setState({ userLocation: null, isLocating: true, error: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        const { latitude: lat, longitude: lng } = position.coords;
        setState({ userLocation: { lat, lng }, isLocating: false, error: null });
      },
      (err) => {
        if (!mountedRef.current) return;
        let message = 'Failed to detect location.';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location permission denied. Enable access in your browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Location unavailable. Make sure GPS is turned on.';
        } else if (err.code === err.TIMEOUT) {
          message = 'Location request timed out. Try again.';
        }
        setState({ userLocation: null, isLocating: false, error: message });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, locate, clearError };
};
