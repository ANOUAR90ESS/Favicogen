-- Project sync.
--
-- Read this before running it: the anon key that reaches this database ships
-- inside the browser bundle, on purpose. It is a publishable key, not a secret,
-- which means every rule that protects one person's work from another's is a
-- rule in this file. Row-level security is not a hardening pass here — it is
-- the entire access control model, and a table with RLS left off is a table
-- anyone on the internet can read.
--
-- Run it in the Supabase SQL editor. It is written to be re-runnable: every
-- statement either creates something that does not exist or replaces itself.

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),

  -- Whose it is. `on delete cascade` so deleting an account really does take
  -- the work with it, rather than orphaning rows no policy can ever reach
  -- again — undeletable data nobody can read is still data you are holding.
  user_id uuid not null references auth.users (id) on delete cascade,

  -- The id the app already gives a project on the device. Sync matches on this
  -- rather than on the primary key, so the same project edited on a phone and
  -- a laptop is one row instead of two.
  client_id text not null,

  name text not null,

  -- The design itself. jsonb rather than a column per field: the shape is a
  -- hundred-odd keys that change whenever the studio grows a control, and a
  -- migration per slider is not a thing anyone would keep up with.
  config jsonb not null,

  -- A small standalone SVG for the project list, so opening it does not mean
  -- fetching every full design.
  thumbnail_svg text,

  -- The device's own edit time, carried across unchanged. This is what decides
  -- a conflict, so it must be the client's clock and not the server's: the
  -- question is which edit came last, not which upload did.
  updated_at timestamptz not null,

  created_at timestamptz not null default now(),

  -- The server's clock, maintained by the trigger below. Used to ask "what
  -- changed since I last pulled", which the client's clock cannot answer
  -- honestly across devices whose clocks disagree.
  synced_at timestamptz not null default now(),

  -- One row per project per person.
  unique (user_id, client_id)
);

comment on table public.projects is
  'One saved logo project per row. Protected entirely by the RLS policies below.';

-- ---------------------------------------------------------------------------
-- Limits
--
-- Every signed-in visitor can write here with a key published in the bundle,
-- so the ceilings are enforced by the database rather than by the client that
-- anyone can bypass. They mirror the app''s own limits.
-- ---------------------------------------------------------------------------

-- The studio keeps fifty projects on the device (MAX_SAVED_PROJECTS).
-- Deliberately NOT `security definer`. Running as the definer would count rows
-- row-level security is meant to hide, which turns this trigger into an oracle:
-- insert a row claiming someone else's id, and "project limit reached" versus
-- "violates row-level security policy" tells you whether *their* account is
-- full. As the invoker, the count sees only rows the caller may see, so a
-- forged insert counts zero, passes here, and is rejected by the policy with
-- nothing learned.
create or replace function public.enforce_project_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  project_count integer;
begin
  select count(*) into project_count
  from public.projects
  where user_id = new.user_id;

  if project_count >= 50 then
    raise exception 'project limit reached'
      using errcode = 'check_violation',
            hint = 'Delete a saved project before adding another.';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_limit on public.projects;
create trigger projects_limit
  before insert on public.projects
  for each row execute function public.enforce_project_limit();

-- An uploaded photograph reaches the studio as a data URL of up to 25 MB, and
-- a row that size would be a denial-of-service wearing a project''s clothes.
-- The client strips the bitmap out before syncing and sends it to Storage
-- instead; this is the backstop for a client that does not.
alter table public.projects
  drop constraint if exists projects_config_size;
alter table public.projects
  add constraint projects_config_size
  check (pg_column_size(config) <= 512 * 1024);

alter table public.projects
  drop constraint if exists projects_thumbnail_size;
alter table public.projects
  add constraint projects_thumbnail_size
  check (thumbnail_svg is null or octet_length(thumbnail_svg) <= 128 * 1024);

alter table public.projects
  drop constraint if exists projects_name_length;
alter table public.projects
  add constraint projects_name_length
  check (char_length(name) between 1 and 200);

alter table public.projects
  drop constraint if exists projects_client_id_length;
alter table public.projects
  add constraint projects_client_id_length
  check (char_length(client_id) between 1 and 128);

-- ---------------------------------------------------------------------------
-- Keeping synced_at honest
--
-- A client could otherwise send any value it liked and make its rows look
-- older or newer than they are, which is the one field the pull relies on.
-- ---------------------------------------------------------------------------

create or replace function public.touch_synced_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.synced_at = now();
  -- The primary key and the owner are not things an update may move. Without
  -- this, one row could be walked from one account to another by a client that
  -- simply asked.
  new.id = old.id;
  new.user_id = old.user_id;
  new.created_at = old.created_at;
  return new;
end;
$$;

drop trigger if exists projects_touch_synced_at on public.projects;
create trigger projects_touch_synced_at
  before update on public.projects
  for each row execute function public.touch_synced_at();

create or replace function public.set_synced_at_on_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.synced_at = now();
  new.created_at = now();
  return new;
end;
$$;

drop trigger if exists projects_synced_at_insert on public.projects;
create trigger projects_synced_at_insert
  before insert on public.projects
  for each row execute function public.set_synced_at_on_insert();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- The only query the app makes: this person's projects, newest change first.
create index if not exists projects_user_synced_idx
  on public.projects (user_id, synced_at desc);

-- ---------------------------------------------------------------------------
-- Privileges
--
-- Supabase's default privileges already grant new tables in `public` to both
-- `anon` and `authenticated`, so this table would be reachable without saying
-- anything. Stated here anyway, for two reasons: a project whose defaults have
-- been tightened would otherwise get a table nobody can read, and — the part
-- that matters — `anon` is deliberately absent. Policies are what keep one
-- person's work from another's; not granting the anonymous role at all means a
-- future policy written loosely still cannot expose anything to a signed-out
-- caller.
-- ---------------------------------------------------------------------------

revoke all on public.projects from anon;
grant select, insert, update, delete on public.projects to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
--
-- The whole of the access control. Four policies, one per verb, each saying
-- the same thing: a row belongs to exactly one person and only that person
-- ever touches it.
--
-- `to authenticated` matters. Without it a policy also applies to the `anon`
-- role, where auth.uid() is null — and while null = user_id is never true, the
-- habit of leaving the anonymous role in scope is how a later, looser policy
-- ends up public by accident.
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;

-- Not even the table owner bypasses these. Supabase connects as the owner for
-- some operations, and without this the policies would simply not apply there.
alter table public.projects force row level security;

drop policy if exists "projects are readable by their owner" on public.projects;
create policy "projects are readable by their owner"
  on public.projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- `with check` on insert is what stops someone writing a row under another
-- person's id. There is no `using` clause on an insert to do it for you.
drop policy if exists "projects are inserted by their owner" on public.projects;
create policy "projects are inserted by their owner"
  on public.projects for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Both clauses, deliberately: `using` decides which rows may be updated,
-- `with check` decides what they may be updated *into*. With only the first,
-- an owner could hand a row to someone else.
drop policy if exists "projects are updated by their owner" on public.projects;
create policy "projects are updated by their owner"
  on public.projects for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "projects are deleted by their owner" on public.projects;
create policy "projects are deleted by their owner"
  on public.projects for delete
  to authenticated
  using ((select auth.uid()) = user_id);
