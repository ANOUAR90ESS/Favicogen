-- Where an uploaded logo actually goes.
--
-- A project's `config` carries `uploadedImageSrc`, and the studio accepts files
-- up to 25 MB — which arrive as a base64 data URL, so roughly 33 MB of text.
-- Putting that in a jsonb column would mean the row limit above rejects every
-- project anyone uploaded a photograph into, and lifting the limit instead
-- would mean a table where fifty projects can be a gigabyte.
--
-- So the bitmap goes to Storage and the row keeps a path to it. The design
-- syncs as data; the image syncs as a file, which is what each of them is.
--
-- The path is `<user id>/<client project id>` — the leading folder is not
-- decoration. Every policy below is written against it, so a file can only be
-- read or written by the person whose id names the folder it sits in.

-- Private: no public URL, no anonymous read. Reaching a file means being
-- signed in as its owner and asking through the API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  false,
  26214400, -- 25 MB, the same ceiling the studio enforces on upload
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Who may touch a file
--
-- `storage.foldername(name)` splits the path; its first element is the folder.
-- Comparing that to the caller's id is the whole rule, and it is why the path
-- layout above is a contract rather than a convention.
-- ---------------------------------------------------------------------------

drop policy if exists "project images are readable by their owner" on storage.objects;
create policy "project images are readable by their owner"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "project images are uploaded by their owner" on storage.objects;
create policy "project images are uploaded by their owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Replacing an image on a project that already has one is an update, not an
-- insert. Both clauses again: what may be changed, and what it may become.
drop policy if exists "project images are replaced by their owner" on storage.objects;
create policy "project images are replaced by their owner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'project-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "project images are deleted by their owner" on storage.objects;
create policy "project images are deleted by their owner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-images'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
