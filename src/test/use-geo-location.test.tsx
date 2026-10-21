import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGeoLocation } from '@/features/auth/grievance/hooks/use-geo-location';

type SuccessCallback = PositionCallback;
type ErrorCallback = PositionErrorCallback;

const geolocation = {
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
  getCurrentPosition: vi.fn(),
};

describe('useGeoLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    geolocation.watchPosition.mockReturnValue(7);
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: geolocation,
    });
  });

  it('keeps a successful retry when the old watcher reports another error', async () => {
    let watchError: ErrorCallback | undefined;
    let retrySuccess: SuccessCallback | undefined;
    geolocation.watchPosition.mockImplementation(
      (_success: SuccessCallback, error: ErrorCallback) => {
        watchError = error;
        return 7;
      },
    );
    geolocation.getCurrentPosition.mockImplementation((success: SuccessCallback) => {
      retrySuccess = success;
    });

    const { result } = renderHook(() => useGeoLocation());

    act(() => watchError?.({ code: 2 } as GeolocationPositionError));
    expect(result.current.errorType).toBe('position_unavailable');

    act(() => result.current.requestLocation());
    expect(geolocation.clearWatch).toHaveBeenCalledWith(7);

    act(() =>
      retrySuccess?.({
        coords: { latitude: 26.87, longitude: 90.49, accuracy: 12 },
      } as GeolocationPosition),
    );
    act(() => watchError?.({ code: 2 } as GeolocationPositionError));

    expect(result.current.coords).toEqual({ lat: 26.87, lng: 90.49 });
    expect(result.current.error).toBeNull();
  });

  it('automatically retries after returning from location settings', async () => {
    let watchError: ErrorCallback | undefined;
    geolocation.watchPosition.mockImplementation(
      (_success: SuccessCallback, error: ErrorCallback) => {
        watchError = error;
        return 7;
      },
    );

    renderHook(() => useGeoLocation());
    act(() => watchError?.({ code: 2 } as GeolocationPositionError));
    act(() => window.dispatchEvent(new Event('focus')));

    await waitFor(() => expect(geolocation.getCurrentPosition).toHaveBeenCalledOnce());
  });

  it('does not clear a valid position when a queued watcher error arrives', () => {
    let watchSuccess: SuccessCallback | undefined;
    let watchError: ErrorCallback | undefined;
    geolocation.watchPosition.mockImplementation(
      (success: SuccessCallback, error: ErrorCallback) => {
        watchSuccess = success;
        watchError = error;
        return 7;
      },
    );

    const { result } = renderHook(() => useGeoLocation());

    act(() =>
      watchSuccess?.({
        coords: { latitude: 27.47, longitude: 89.64, accuracy: 8 },
      } as GeolocationPosition),
    );
    act(() => watchError?.({ code: 2 } as GeolocationPositionError));

    expect(result.current.coords).toEqual({ lat: 27.47, lng: 89.64 });
    expect(result.current.error).toBeNull();
  });
});
