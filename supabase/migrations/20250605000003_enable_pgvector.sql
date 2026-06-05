-- Enable pgvector extension for image similarity search
create extension if not exists vector
with schema extensions;

-- Add embedding column to grievances for image similarity detection
alter table public.grievances
  add column if not exists image_embedding extensions.vector(512);

-- Create HNSW index for efficient cosine similarity search
create index if not exists idx_grievances_image_embedding
  on public.grievances
  using hnsw (image_embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 200);

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
