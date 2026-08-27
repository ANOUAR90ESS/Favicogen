import { useCallback, useEffect, useState } from 'react';

/**
 * Five routes, on the History API.
 *
 * A router library would be a reasonable choice and this deliberately is not
 * one: there are five paths, none of them nested, none with parameters, and the
 * bundle is already the thing most worth shrinking here. What follows is the
 * part of a router this app actually uses — the current path, a way to change
 * it, and the back button working.
 *
 * The service worker serves `index.html` for any navigation it does not
 * recognise (`navigateFallback`), which is what makes a deep link like
 * `/auth/callback` load the app instead of a 404 on a fresh visit.
 */

export type Route =
  | '/'
  | '/studio'
  | '/signin'
  | '/signup'
  | '/reset-password'
  | '/update-password'
  | '/auth/callback';

const ROUTES: Route[] = [
  '/',
  '/studio',
  '/signin',
  '/signup',
  '/reset-password',
  '/update-password',
  '/auth/callback',
];

const ROUTE_SET = new Set<string>(ROUTES);

/**
 * The route for a path, with anything unrecognised treated as the landing page.
 *
 * A trailing slash is the same route — `/studio/` and `/studio` are one place,
 * and letting them differ is how a link shared over chat lands somewhere else
 * than the one that was copied.
 */
export function routeFor(pathname: string): Route {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const normalised = trimmed === '' ? '/' : trimmed;
  return ROUTE_SET.has(normalised) ? (normalised as Route) : '/';
}

/**
 * The current route, and a way to move between them.
 *
 * `popstate` covers the back and forward buttons; `navigate` pushes, so those
 * buttons have something to go back to. Replacing rather than pushing is for
 * the one case that needs it — landing on `/auth/callback`, whose URL carries
 * single-use tokens and should not survive in history.
 */
export function useRoute(): {
  route: Route;
  navigate: (to: Route, options?: { replace?: boolean }) => void;
} {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? '/' : routeFor(window.location.pathname)
  );

  useEffect(() => {
    const onPop = () => setRoute(routeFor(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: Route, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }
    setRoute(to);
    // A new page starts at its top. Browsers restore the old scroll position on
    // a pushState, which lands someone halfway down a form they have not seen.
    window.scrollTo(0, 0);
  }, []);

  return { route, navigate };
}
