import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import router from './router/index.jsx';
import GlobalErrorBoundary from './components/error/GlobalErrorBoundary.jsx';
import AppToastProvider from './components/ui/AppToastProvider.jsx';

/**
 * Application bootstrap entry point.
 *
 * Phase 3 migration: The monolithic <App /> component has been replaced by
 * <RouterProvider> which delegates application structure entirely to the
 * centralized router configuration in src/router/index.jsx.
 *
 * <RouterProvider> establishes the React Router context, making useNavigate(),
 * useLocation(), useParams(), and all other router hooks available throughout
 * the component tree — including in the <RouterSetter> component rendered
 * inside <AppShell>, which seeds the navigationRef singleton for the Axios
 * response interceptor.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <AppToastProvider>
        <RouterProvider router={router} />
      </AppToastProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);
