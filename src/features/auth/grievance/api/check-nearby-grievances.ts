import { supabase } from '@/lib/supabase';

export interface NearbyGrievance {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
  created_at: string;
}

export const checkNearbyGrievances = async (
  lat: number,
  lng: number,
  radiusMeters: number = 10,
): Promise<NearbyGrievance[]> => {
  const { data, error } = await supabase.rpc('check_nearby_grievances', {
    target_lat: lat,
    target_lng: lng,
    radius_meters: radiusMeters,
  });

  if (error) throw error;
  return data ?? [];
};
