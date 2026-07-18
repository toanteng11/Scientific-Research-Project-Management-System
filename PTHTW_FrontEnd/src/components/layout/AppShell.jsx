import { Outlet } from 'react-router-dom';
import RouterSetter from '../RouterSetter';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

/**
 * AppShell — Authenticated application layout container.
 *
 * Structure:
 *   ┌──────────────┬────────────────────────────────────┐
 *   │              │  TopBar (h-14)                     │
 *   │   Sidebar    ├────────────────────────────────────┤
 *   │   (w-64)     │  Page content (<Outlet />)         │
 *   │              │  scrollable, p-6                   │
 *   └──────────────┴────────────────────────────────────┘
 *
 * AppShell is the parent layout route for all authenticated routes.
 * It does NOT perform any authentication check itself — that responsibility
 * is delegated to the nested <PrivateRoute> components that wrap each
 * route group in the router configuration.
 *
 * RouterSetter is rendered here (inside the RouterProvider context) to
 * seed the navigationRef singleton used by the Axios response interceptor.
 */
export default function AppShell() {
  return (
    <>
      <RouterSetter />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
