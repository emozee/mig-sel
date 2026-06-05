import { supabase } from '@/lib/supabase';

export interface DuplicateImageResult {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  image_hash: string;
  distance_meters: number;
  created_at: string;
}

export const findDuplicateImage = async (
  hash: string,
  lat: number,
  lng: number,
  radiusMeters: number = 10,
): Promise<DuplicateImageResult[]> => {
  const { data, error } = await supabase.rpc('find_duplicate_image', {
    target_hash: hash,
    target_lat: lat,
    target_lng: lng,
    radius_meters: radiusMeters,
  });

  if (error) throw error;
  return data ?? [];
};

/** Compute SHA-256 hex digest of a File using Web Crypto API (browser-native, free) */
export const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};
