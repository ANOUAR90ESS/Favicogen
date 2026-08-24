import React, { useCallback, useEffect, useRef } from 'react';

/**
 * The shared dialog shell.
 *
 * Every modal in the app previously rolled its own overlay markup, and a
 * search across all twelve found zero instances of `role="dialog"`,
 * `aria-modal`, Escape handling, or focus containment. A keyboard user could
 * Tab straight out of an open dialog into the page behind it, and a screen
 * reader was never told a dialog had opened at all.
 *
 * Everything a dialog needs to behave correctly lives here so no individual
 * modal has to remember it.
 */

/** Elements that can hold focus, for the Tab cycle. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name. Rendered visually unless `titleId` points elsewhere. */
  label: string;
  /** Optional id of an existing heading to name the dialog instead. */
  labelledBy?: string;
  children: React.ReactNode;
  /** Wrapper classes for the dialog panel. */
  className?: string;
  /** Set false for dialogs where a stray backdrop click would lose work. */
  closeOnBackdrop?: boolean;
  /** Additional classes for the backdrop. */
  overlayClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  label,
  labelledBy,
  children,
  className = '',
  closeOnBackdrop = true,
  overlayClassName = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  /** Where focus came from, so it can be handed back on close. */
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const getFocusable = useCallback((): HTMLElement[] => {
    if (!panelRef.current) return [];
    const nodes: HTMLElement[] = [];
    panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR).forEach((node) => {
      const element = node as HTMLElement;
      // Skip anything hidden, but keep whatever currently holds focus.
      if (element.offsetParent !== null || element === document.activeElement) {
        nodes.push(element);
      }
    });
    return nodes;
  }, []);

  // Move focus into the dialog on open, and return it on close.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Wait a frame so children rendered this tick are focusable.
    const raf = requestAnimationFrame(() => {
      const focusable = getFocusable();
      (focusable[0] ?? panelRef.current)?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, getFocusable]);

  // Escape closes; Tab cycles within the dialog instead of escaping behind it.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, getFocusable]);

  // The page behind a modal should not scroll.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 max-md:landscape:p-2 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 ${overlayClassName}`}
      onMouseDown={(event) => {
        // mousedown, not click: a drag that starts inside and ends on the
        // backdrop should not count as dismissing the dialog.
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
