-- A stand-in for the parts of Supabase these migrations lean on. Deliberately
-- faithful where it matters: auth.uid() reads the request JWT the same way,
-- and the roles are the same two the policies name.
create extension if not exists pgcrypto;

create schema if not exists auth;
create schema if not exists storage;

do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;

create table auth.users (id uuid primary key default gen_random_uuid(), email text unique);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- Storage, as much of it as the object policies touch.
create table storage.buckets (
  id text primary key, name text not null, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text not null, owner uuid
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language plpgsql as $$
begin
  return string_to_array(regexp_replace(name, '/[^/]*$', ''), '/');
end $$;

grant usage on schema public, auth, storage to anon, authenticated;
grant all on all tables in schema public, storage to anon, authenticated;
grant execute on all functions in schema auth, storage to anon, authenticated;
