import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppNotificationsHost } from './components/AppNotifications';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <AppNotificationsHost />
    </ErrorBoundary>
  </StrictMode>,
);
