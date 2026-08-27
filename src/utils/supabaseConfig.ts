/**
 * Whether this build has an account service, answered without loading one.
 *
 * Split from the client on purpose. `isAuthConfigured` is read by the header
 * and by the studio's navbar — both of which paint on the critical path — and
 * importing it from the same module as `createClient` dragged the entire
 * Supabase library into the main chunk: 252 KB added to the first load of a
 * canvas that never authenticates anything. The library now arrives only when
 * someone actually opens an account page.
 *
 * The anon key is a publishable key, meant to ship in a browser bundle; row-
 * level security in the Supabase project, not secrecy, is what protects the
 * data. The service-role key is the secret one and must never appear in any
 * file the browser can reach — which the `VITE_` prefix guarantees it would.
 */

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

/**
 * True when there is somewhere real to authenticate against.
 *
 * Both halves are checked rather than assumed: a half-set pair is the likeliest
 * deployment mistake, and it produces exactly the broken form the account pages
 * exist to avoid showing.
 */
export const isAuthConfigured: boolean = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

/**
 * Where Supabase sends someone back to after they follow an emailed link.
 *
 * Built from the running origin rather than a configured host, so a preview
 * deployment returns to itself instead of to production. The path must also be
 * listed as a redirect URL in the Supabase project, or the link comes back
 * rejected.
 */
export function authRedirectUrl(path = '/auth/callback'): string {
  return new URL(path, window.location.origin).href;
}
