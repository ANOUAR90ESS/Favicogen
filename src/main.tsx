import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './i18n';
import './index.css';
import { registerServiceWorker } from './utils/registerServiceWorker.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Everything the studio does is local; losing the network should not lose the
// tool. A no-op in the native shell and in a browser without service workers.
registerServiceWorker();
