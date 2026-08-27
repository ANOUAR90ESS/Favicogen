import { describe, expect, it } from 'vitest';
import { routeFor } from '../router';

/**
 * The path-to-route rule, which is the only part of this router with a decision
 * in it. The hook around it is a `popstate` listener and a `pushState`.
 */
describe('routeFor', () => {
  it('recognises every route it serves', () => {
    expect(routeFor('/')).toBe('/');
    expect(routeFor('/studio')).toBe('/studio');
    expect(routeFor('/signin')).toBe('/signin');
    expect(routeFor('/signup')).toBe('/signup');
    expect(routeFor('/reset-password')).toBe('/reset-password');
    expect(routeFor('/update-password')).toBe('/update-password');
    expect(routeFor('/auth/callback')).toBe('/auth/callback');
  });

  it('treats a trailing slash as the same place', () => {
    // A link copied out of an address bar often carries one, and landing
    // somewhere else than the page that was shared is the whole bug.
    expect(routeFor('/studio/')).toBe('/studio');
    expect(routeFor('/auth/callback/')).toBe('/auth/callback');
    expect(routeFor('/signin//')).toBe('/signin');
  });

  it('keeps the bare root as the root rather than emptying it', () => {
    expect(routeFor('/')).toBe('/');
    expect(routeFor('')).toBe('/');
  });

  it('sends anything unknown to the landing page', () => {
    // A 404 route would be a page to design and translate for a site with
    // seven addresses. The landing page is where a wrong link should end up.
    expect(routeFor('/nope')).toBe('/');
    expect(routeFor('/studio/extra')).toBe('/');
    expect(routeFor('/SignIn')).toBe('/');
  });
});
