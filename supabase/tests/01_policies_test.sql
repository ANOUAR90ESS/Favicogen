-- What the policies are supposed to stop, attempted.
--
-- The anon key reaches this database from inside a published browser bundle,
-- so these policies are not defence in depth — they are the only defence. That
-- makes "it looks right" an unacceptable standard for them, and this file the
-- difference between a policy that was reasoned about and one that was tested.
--
-- Every line prints what it wanted, so a wrong answer is visible rather than
-- inferred from an exit code. Run it with supabase/tests/run.sh.

\set ON_ERROR_STOP 0
\pset pager off
\t on

set role postgres;
truncate public.projects;
delete from storage.objects;
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111','a@example.com'),
  ('22222222-2222-2222-2222-222222222222','b@example.com')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- One person's work is invisible to another
-- ---------------------------------------------------------------------------
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.projects (user_id, client_id, name, config, updated_at)
  values ('11111111-1111-1111-1111-111111111111','p1','A logo','{"text":"Alpha"}', now());
select '1.  A sees own rows ............. ' || count(*) || '   want 1' from public.projects;

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select '2.  B sees A rows ............... ' || count(*) || '   want 0' from public.projects;

-- These affect no rows rather than erroring: a policy filters, it does not
-- announce that there was something to filter.
update public.projects set name = 'stolen';
delete from public.projects;

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select '3.  A row survived B ............ ' || count(*) || '   want 1' from public.projects;
select '4.  A name intact ............... ' || name || '   want A logo' from public.projects;

-- ---------------------------------------------------------------------------
-- A row cannot be written under, or moved to, another account
-- ---------------------------------------------------------------------------
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.projects (user_id, client_id, name, config, updated_at)
  values ('11111111-1111-1111-1111-111111111111','forged','forged','{}', now());
select '5.  forged insert ............... must have raised RLS above';

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
update public.projects set user_id = '22222222-2222-2222-2222-222222222222' where client_id = 'p1';
select '6.  owner after reassign ........ ' || left(user_id::text, 8) || '   want 11111111' from public.projects;

-- synced_at is what an incremental pull trusts, so a client must not set it.
update public.projects set synced_at = '1999-01-01', created_at = '1999-01-01' where client_id = 'p1';
select '7.  synced_at forged to 1999 .... ' || extract(year from synced_at)::text || '   want this year' from public.projects;

-- ---------------------------------------------------------------------------
-- The limits, which are the client's limits restated where they cannot be
-- edited out of the bundle
-- ---------------------------------------------------------------------------
set role postgres; truncate public.projects; set role authenticated;
insert into public.projects (user_id, client_id, name, config, updated_at)
select '11111111-1111-1111-1111-111111111111','p'||g,'P'||g,'{}'::jsonb, now() from generate_series(1,50) g;
insert into public.projects (user_id, client_id, name, config, updated_at)
  values ('11111111-1111-1111-1111-111111111111','p51','P51','{}', now());
select '8.  51st project ................ must have raised the limit above';

-- A full account must not be detectable from outside it. Were the limit
-- trigger `security definer`, this would answer "project limit reached" and
-- an empty account would answer differently — an oracle on someone else's data.
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.projects (user_id, client_id, name, config, updated_at)
  values ('11111111-1111-1111-1111-111111111111','probe','probe','{}', now());
select '9.  probing a full account ...... must be the RLS error, not the limit';

set role postgres; truncate public.projects; set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.projects (user_id, client_id, name, config, updated_at)
  values ('11111111-1111-1111-1111-111111111111','big','Big',
          jsonb_build_object('uploadedImageSrc', repeat('x', 900000)), now());
select '10. 900 KB config ............... must have raised the size check';

insert into public.projects (user_id, client_id, name, config, updated_at)
  values ('11111111-1111-1111-1111-111111111111','ok','Ok', jsonb_build_object('text', repeat('x',100000)), now());
select '11. 100 KB config ............... accepted, rows ' || count(*) || '   want 1' from public.projects;

insert into public.projects (user_id, client_id, name, config, updated_at)
  values ('11111111-1111-1111-1111-111111111111','ok','Duplicate','{}', now());
select '12. same client_id twice ........ must have raised the unique above';

-- A row may not point at a file in someone else's folder. Without this the
-- table would be a place to store a path the Storage policies then refuse to
-- serve, which fails later and further away than it needs to.
update public.projects
  set image_path = '22222222-2222-2222-2222-222222222222/ok' where client_id = 'ok';
select '12a. image_path in another folder ... must have raised the check above';

update public.projects
  set image_path = user_id::text || '/' || client_id where client_id = 'ok';
select '12b. image_path in own folder ....... accepted, ' || count(*) || '   want 1'
  from public.projects where image_path is not null;

-- ---------------------------------------------------------------------------
-- Storage: the first folder of the path is the owner, and it is enforced
-- ---------------------------------------------------------------------------
insert into storage.objects (bucket_id, name)
  values ('project-images','11111111-1111-1111-1111-111111111111/ok.png');
select '13. upload to own folder ........ rows ' || count(*) || '   want 1' from storage.objects;

insert into storage.objects (bucket_id, name)
  values ('project-images','22222222-2222-2222-2222-222222222222/steal.png');
select '14. upload to another folder .... must have raised RLS above';

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select '15. B sees A files .............. ' || count(*) || '   want 0' from storage.objects;
delete from storage.objects;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select '16. A file survived B ........... ' || count(*) || '   want 1' from storage.objects;

-- ---------------------------------------------------------------------------
-- Signed out is not a reader
-- ---------------------------------------------------------------------------
set role anon;
set request.jwt.claim.sub = '';
select count(*) from public.projects;
select '17. anon read ................... must be permission denied, just above';
insert into public.projects (user_id, client_id, name, config, updated_at)
  values ('11111111-1111-1111-1111-111111111111','anon','anon','{}', now());
select '18. anon write .................. must be permission denied, just above';
