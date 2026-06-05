-- Create a function to check for nearby grievances within a radius
-- Uses the Haversine formula for accurate spherical distance calculation
create or replace function public.check_nearby_grievances(
  target_lat double precision,
  target_lng double precision,
  radius_meters double precision default 10
)
returns table(
  id uuid,
  title text,
  description text,
  category text,
  image_url text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  created_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    g.id,
    g.title,
    g.description,
    g.category,
    g.image_url,
    g.latitude,
    g.longitude,
    (
      6371000 * 2 * asin(
        sqrt(
          power(sin(radians(g.latitude - target_lat) / 2), 2) +
          cos(radians(target_lat)) * cos(radians(g.latitude)) *
          power(sin(radians(g.longitude - target_lng) / 2), 2)
        )
      )
    )::double precision as distance_meters,
    g.created_at
  from public.grievances g
  where g.latitude is not null
    and g.longitude is not null
    and (
      6371000 * 2 * asin(
        sqrt(
          power(sin(radians(g.latitude - target_lat) / 2), 2) +
          cos(radians(target_lat)) * cos(radians(g.latitude)) *
          power(sin(radians(g.longitude - target_lng) / 2), 2)
        )
      )
    ) <= radius_meters
  order by distance_meters;
$$;

-- Grant execute to anon and authenticated so the client can call it
grant execute on function public.check_nearby_grievances(double precision, double precision, double precision)
  to anon, authenticated;

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
