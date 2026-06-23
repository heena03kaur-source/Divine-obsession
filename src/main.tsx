import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Suppress cross-origin "Script error." to prevent annoying development overlays
window.addEventListener('error', (e) => {
  if (e.message === 'Script error.' || e.message?.includes('Script error')) {
    e.preventDefault();
    e.stopPropagation();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && (e.reason === 'Script error.' || e.reason.message === 'Script error.')) {
    e.preventDefault();
    e.stopPropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
