-- Storage RLS policies for the diamonds bucket
-- Allow authenticated users to upload images
create policy "Authenticated users can upload diamond images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'diamonds');

-- Allow authenticated users to update their own diamond images
create policy "Users can update their own diamond images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'diamonds' and auth.uid() = owner);

-- Allow authenticated users to delete their own diamond images
create policy "Users can delete their own diamond images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'diamonds' and auth.uid() = owner);

-- Public bucket already allows select by default
