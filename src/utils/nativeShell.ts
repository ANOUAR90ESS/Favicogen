import { isNativePlatform } from './nativePlatform';

/**
 * The bits of native behaviour a user notices immediately if they are missing.
 *
 * Installed once at startup and never torn down: the app is the process, so
 * there is no point at which unsubscribing would matter.
 */

interface BackButtonEvent {
  canGoBack: boolean;
}

interface AppPlugin {
  addListener(
    event: 'backButton',
    handler: (state: BackButtonEvent) => void
  ): Promise<{ remove: () => Promise<void> }>;
  exitApp(): Promise<void>;
}

/**
 * Android's back button.
 *
 * Left alone, Capacitor closes the app on every press — so a user who opens
 * the export dialog and presses back to leave it quits the studio instead,
 * losing nothing saved but every unsaved adjustment on screen.
 *
 * The dialogs already close on Escape, and that handler lives in the shared
 * Modal component with focus containment and everything else. Rather than
 * teach this a list of twelve open-state flags that would drift the moment a
 * thirteenth dialog is added, the press is delivered as Escape and the
 * existing handler decides. Only when nothing consumed it does the app exit.
 */
export async function installAndroidBackButton(): Promise<void> {
  if (!isNativePlatform()) return;

  const { App } = (await import('@capacitor/app')) as unknown as { App: AppPlugin };

  await App.addListener('backButton', () => {
    const dialogOpen = document.querySelector('[role="dialog"]') !== null;

    if (dialogOpen) {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );
      return;
    }

    // Nothing on screen wanted the press. Leaving is what back means here:
    // the studio is a single screen, and everything in it is auto-saved.
    void App.exitApp();
  });
}
