# Accounts

Accounts are **optional, and off by default**. With no Supabase project
configured the studio is exactly what it was: it draws, exports and saves on the
device, offline and in the native shell, and the account pages say plainly that
accounts are not enabled here.

That default is deliberate. The alternative — a sign-in form that accepts a
password and does nothing with it — is worse than having no sign-in at all,
because it is a lie told in the one place where people type a real secret.

## What an account currently does

It authenticates. That is the whole of it today: sign up, confirm an address,
sign in, sign out, recover a password. **Projects are not synced yet** — they
live in this browser's IndexedDB whether or not anyone is signed in.

This is written down rather than implied, because "create an account" on most
sites means something is kept for you, and here it does not yet. Syncing saved
projects to the account is the obvious next step and the reason the layer
exists.

## The database schema

`supabase/migrations/` holds it. Run the files in order in the Supabase SQL
editor, or with the Supabase CLI. They are written to be re-runnable.

| file | what it creates |
|---|---|
| `0001_projects.sql` | `public.projects`, its limits, and the four row-level security policies |
| `0002_project_images.sql` | the private `project-images` Storage bucket and its four object policies |

### Why it is shaped this way

**Row-level security is the whole access model, not a hardening pass.** The
anon key ships inside the browser bundle on purpose — it is publishable, not
secret — so every rule keeping one person's work from another's is a policy in
those files. A table with RLS left off is a table anyone on the internet can
read.

**A design is a row; a bitmap is a file.** `config` is `jsonb`, because the
shape is a hundred-odd keys that change whenever the studio grows a control and
a migration per slider is not something anyone keeps up with. But an uploaded
photograph arrives as a data URL of up to 25 MB, and putting that in the row
would mean either rejecting every project with a photo in it or a table where
fifty projects are a gigabyte. So the bitmap goes to Storage under
`<user id>/<project id>`, and that leading folder is a contract: every object
policy is written against it.

**The limits are the client's limits, restated where they cannot be edited out
of the bundle** — fifty projects per account, 512 KB per design, 128 KB per
thumbnail.

**`updated_at` has no default, deliberately.** It is the device's clock, carried
across unchanged, because a conflict asks which *edit* came last and not which
upload did. Defaulting it would quietly substitute the server's clock for the
answer. `synced_at` is the server's own and a trigger overwrites whatever a
client sends, since that is the field an incremental pull trusts.

### Verifying it

`supabase/tests/run.sh` starts a throwaway PostgreSQL, applies the migrations
and then tries to break them: reading another account's projects, writing a row
under someone else's id, moving a row between accounts, forging `synced_at`,
exceeding the caps, uploading into another person's Storage folder, and reading
anything at all while signed out. Eighteen checks, each printing what it
expected.

It is not wired into CI — it needs a PostgreSQL server and this SQL changes
rarely — so run it whenever a migration or a policy changes, which is exactly
when a mistake would be both invisible and total.

Writing those tests found a real flaw in the first draft. The project-limit
trigger was `security definer`, which made it count rows RLS is meant to hide:
inserting a row under someone else's id answered *"project limit reached"* for
a full account and a policy error for an empty one — an oracle telling you
about another person's data. It is `security invoker` now, so the count sees
only what the caller may see and a forged insert learns nothing.

## Turning it on

1. Create a project at supabase.com. The free tier is enough.
2. From **Project Settings → API**, copy the **Project URL** and the **anon /
   publishable** key.
3. Set them where the bundle is built:

   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<the anon key>
   ```

   Both are read by Vite at **build** time, so setting them only in a runtime
   environment does nothing. Setting one alone leaves accounts off.

4. Run `supabase/migrations/0001_projects.sql` and then
   `0002_project_images.sql` in the SQL editor.
5. Under **Authentication → URL Configuration**, add these to *Redirect URLs*
   for every origin you deploy to, preview deployments included:

   ```
   https://<your-host>/auth/callback
   https://<your-host>/update-password
   ```

   A link that returns to an address not on that list comes back rejected, which
   is the most common reason a confirmation email appears to do nothing.

The anon key is publishable and is *meant* to ship in the browser bundle;
row-level security in the project, not secrecy, is what protects data. The
service-role key is the secret one. Never give it a `VITE_` name — that prefix
is precisely what inlines a value into the bundle.

## Deep links must reach the app

Confirmation and recovery emails link straight to `/auth/callback` and
`/update-password`, often on a browser that has never opened this app. The host
therefore has to serve `index.html` for paths it does not recognise, or that
click is a 404 in the middle of signing up.

- The bundled Express server already does this (`server.ts` ends with a
  catch-all that sends `index.html`), so `npm start` needs nothing.
- The service worker does it too, for anyone who has opened the app before.
- **A static host serving `dist/` directly does not**, unless told to. On
  Vercel, that is a rewrite:

  ```json
  { "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }] }
  ```

  The `api/` exclusion matters if the same deployment also serves `/api/ai/*`;
  without it, the AI routes would be answered with the HTML page.

Verify it the way the test suite does: request `/signin` on a fresh browser and
confirm it returns the app rather than a 404. `e2e/landing.spec.ts` checks every
account route this way against the production build.

## Routes

| path | what it is |
|---|---|
| `/` | the public landing page — but a visitor with saved work is sent to `/studio` instead, and so is the native app |
| `/studio` | the studio, and the PWA `start_url` |
| `/signin`, `/signup` | the account forms |
| `/reset-password` | asks for a recovery link |
| `/update-password` | where that link lands |
| `/auth/callback` | where a confirmation link lands; forwards to the studio |

Anything unrecognised renders the landing page rather than a dedicated 404,
which would be a page to design and translate for a site with seven addresses.
