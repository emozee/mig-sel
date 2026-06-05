-- Add image_hash column for exact duplicate image detection
alter table public.grievances
  add column if not exists image_hash text;

-- Index for fast hash lookups
create index if not exists idx_grievances_image_hash
  on public.grievances (image_hash);

-- Function to find duplicate by image hash within a radius
create or replace function public.find_duplicate_image(
  target_hash text,
  target_lat double precision,
  target_lng double precision,
  radius_meters double precision default 10
)
returns table(
  id uuid,
  title text,
  category text,
  image_url text,
  image_hash text,
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
    g.category,
    g.image_url,
    g.image_hash,
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
  where g.image_hash = target_hash
    and g.latitude is not null
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

grant execute on function public.find_duplicate_image(text, double precision, double precision, double precision)
  to anon, authenticated;

notify pgrst, 'reload schema';
