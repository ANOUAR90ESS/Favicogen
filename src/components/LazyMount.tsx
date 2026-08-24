import React, { useEffect, useState } from 'react';

/**
 * Defers mounting children until the first time `when` is true, then keeps
 * them mounted.
 *
 * Code-splitting the modals is only half the job: they are all rendered in
 * App's tree with an `isOpen` prop, so React resolves every lazy component on
 * the first paint just to render nothing. All eleven chunks arrived up front
 * and the split bought nothing at runtime.
 *
 * Latching rather than unmounting on close is deliberate — a modal keeps the
 * state the user left in it (a half-configured export, a typed channel name)
 * across open and close, exactly as it did before the split.
 */
export const LazyMount: React.FC<{ when: boolean; children: React.ReactNode }> = ({
  when,
  children,
}) => {
  const [hasOpened, setHasOpened] = useState(when);

  useEffect(() => {
    if (when) setHasOpened(true);
  }, [when]);

  if (!hasOpened) return null;
  return <>{children}</>;
};
