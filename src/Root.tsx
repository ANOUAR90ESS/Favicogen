import React, { lazy, Suspense, useEffect, useState } from 'react';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { PublicHeader } from './components/PublicHeader';
import { useRoute, type Route } from './utils/router';
import { loadCurrentProject } from './utils/storage';
import { isNativePlatform } from './utils/nativePlatform';

/**
 * What lives at which address.
 *
 * The studio is the product and everything else here exists around it, so the
 * two rules this file follows are: no route may make the studio wait on it, and
 * nobody with work saved may be shown a pitch instead of that work.
 *
 * The second rule is why `/` is not simply the marketing page. Someone who has
 * used this before and types the bare domain is going back to their project;
 * putting a hero section in front of them is the same interruption the
 * first-run screen already learned not to make. So `/` asks storage the same
 * question the studio asks — is there saved work — and sends a returning
 * visitor straight on. The redirect *replaces* the entry, so their back button
 * still leaves the site rather than bouncing between the two.
 *
 * Everything but the studio is code-split. The marketing page and the account
 * pages are each visited once or never, and none of them belongs in the bundle
 * that has to paint a canvas.
 */

const MarketingLanding = lazy(() =>
  import('./pages/MarketingLanding').then((m) => ({ default: m.MarketingLanding }))
);
const SignInPage = lazy(() => import('./auth/SignInPage').then((m) => ({ default: m.SignInPage })));
const SignUpPage = lazy(() => import('./auth/SignUpPage').then((m) => ({ default: m.SignUpPage })));
const ResetPasswordPage = lazy(() =>
  import('./auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const UpdatePasswordPage = lazy(() =>
  import('./auth/UpdatePasswordPage').then((m) => ({ default: m.UpdatePasswordPage }))
);
const AuthCallbackPage = lazy(() =>
  import('./auth/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage }))
);

/** Holds the frame while a route's chunk arrives, without shifting the layout. */
const RouteFallback: React.FC = () => (
  <div className="flex-1 min-h-0 bg-slate-100/70" aria-hidden="true" />
);

const Root: React.FC = () => {
  const { route, navigate } = useRoute();

  // Undecided until storage answers. Rendering the pitch first and swapping it
  // for the studio a moment later is a flash of the wrong page, which reads as
  // the app losing someone's work for exactly as long as it takes to correct.
  const [hasSavedWork, setHasSavedWork] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadCurrentProject()
      .then((stored) => {
        if (!cancelled) setHasSavedWork(Boolean(stored.text || stored.tagline));
      })
      // Unreadable storage is not a returning visitor. The studio reports its
      // own storage trouble; this only decides which page to open.
      .catch(() => {
        if (!cancelled) setHasSavedWork(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (route !== '/') return;
    // Someone who installed the app, or opened it on a phone, has already been
    // sold on it. A pitch is what the web page is for; the app opens the tool.
    if (hasSavedWork || isNativePlatform()) navigate('/studio', { replace: true });
  }, [route, hasSavedWork, navigate]);

  const go = (to: Route, options?: { replace?: boolean }) => navigate(to, options);

  let page: React.ReactNode;

  switch (route) {
    case '/':
      // Still asking storage, or about to be sent to the studio: either way the
      // pitch would be the wrong thing to paint.
      page =
        hasSavedWork === false && !isNativePlatform() ? (
          <MarketingLanding onNavigate={go} />
        ) : (
          <RouteFallback />
        );
      break;
    case '/signin':
      page = <SignInPage onNavigate={go} />;
      break;
    case '/signup':
      page = <SignUpPage onNavigate={go} />;
      break;
    case '/reset-password':
      page = <ResetPasswordPage onNavigate={go} />;
      break;
    case '/update-password':
      page = <UpdatePasswordPage onNavigate={go} />;
      break;
    case '/auth/callback':
      page = <AuthCallbackPage onNavigate={go} />;
      break;
    default:
      page = <App onNavigate={go} />;
  }

  // The studio brings its own chrome and fills the viewport; every other route
  // shares one header and scrolls.
  if (route === '/studio') {
    return (
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>{page}</Suspense>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-white font-sans text-slate-900 antialiased">
        <PublicHeader onNavigate={go} />
        <Suspense fallback={<RouteFallback />}>{page}</Suspense>
      </div>
    </AuthProvider>
  );
};

export default Root;
