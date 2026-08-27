import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '../utils/supabaseClient';
import { isAuthConfigured } from '../utils/supabaseConfig';

/**
 * Who is signed in, for the parts of the app that care.
 *
 * Deliberately small. An account here is optional — the studio draws, exports
 * and saves without one, offline and in the native shell — so nothing in the
 * workspace may depend on this resolving, or on it resolving to a user. What
 * this provides is an answer to "is someone signed in", and the three actions
 * that change that answer.
 *
 * `status` separates *not yet known* from *known to be nobody*, because those
 * render differently and conflating them is what makes a signed-in visitor see
 * a "Sign in" button flash on every page load.
 */

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out' | 'unavailable';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  status: 'unavailable',
  user: null,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>(
    isAuthConfigured ? 'loading' : 'unavailable'
  );
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const apply = (session: Session | null) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setStatus(session?.user ? 'signed-in' : 'signed-out');
    };

    void getSupabase().then((supabase) => {
      // No account layer in this deployment, or the client could not be
      // fetched. Nothing to wait for and nothing to offer; the studio is
      // unaffected either way, and `status` stays 'unavailable'.
      if (cancelled || !supabase) return;

      void supabase.auth
        .getSession()
        .then(({ data }) => apply(data.session))
        // A failed read is not a signed-in visitor, and it is not a crash
        // either: the workspace does not need this to work.
        .catch(() => apply(null));

      // Covers a token refreshing, a sign-out in another tab, and the session
      // that appears when someone follows a confirmation link.
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        apply(session);
      });
      unsubscribe = () => subscription.subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    // The listener above sets the state; doing it here as well would be a
    // second source of truth for the same fact.
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signOut }),
    [status, user, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
