import { supabase } from './supabase';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

type NominatimResult = {
  address?: {
    state?: string;
    county?: string;
    country?: string;
  };
};

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json&zoom=8&accept-language=en`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'mig-sel/1.0' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult;
    return data.address?.state ?? data.address?.county ?? null;
  } catch {
    return null;
  }
}

export async function captureUserLocation(userId: string): Promise<void> {
  if (!navigator.geolocation) return;

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 86400000,
      });
    });

    const dzongkhag = await reverseGeocode(position.coords.latitude, position.coords.longitude);

    if (dzongkhag) {
      await supabase.from('profiles').update({ location: dzongkhag }).eq('id', userId);
    }
  } catch {
    // User denied or error — silently skip
  }
}
