import type { SupabaseClient } from '@supabase/supabase-js';
import { isAuthConfigured, supabaseAnonKey, supabaseUrl } from './supabaseConfig';

/**
 * The account client, fetched only when an account page needs it.
 *
 * This app works without an account and without a network: the generators, the
 * rasteriser and the ZIP builder never touch a server, and a project lives in
 * the visitor's own IndexedDB. An account is something extra on top of that,
 * never a gate in front of it — so the library that implements it has no
 * business in the chunk that paints the canvas, and is imported dynamically.
 *
 * A deployment can perfectly well have no Supabase project behind it, and most
 * forks of this repo will not. In that case there is nothing to load, and the
 * pages that would have used it say so plainly rather than showing a form that
 * takes a password and does nothing with it — a lie told in the one place
 * people type a real secret.
 *
 * The type-only import above costs nothing at runtime.
 */

let clientRequest: Promise<SupabaseClient | null> | null = null;

/**
 * The shared client, or null when this build has no account service.
 *
 * Null rather than a throw: every caller has something sensible to render when
 * accounts are unavailable, and an exception on a landing page would take the
 * whole app down for a feature it does not need. A failed *load* — offline,
 * a blocked chunk — is treated the same way, and clears itself so the next
 * attempt can retry.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isAuthConfigured) return Promise.resolve(null);

  clientRequest ??= import('@supabase/supabase-js')
    .then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // The session outlives the tab, the way people expect a sign-in to.
          persistSession: true,
          autoRefreshToken: true,
          // Confirmation and recovery links come back with their tokens in the
          // URL; this is what reads them before the address bar is cleaned up.
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      })
    )
    .catch(() => {
      clientRequest = null;
      return null;
    });

  return clientRequest;
}

export { authRedirectUrl, isAuthConfigured } from './supabaseConfig';
