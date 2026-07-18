import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import ForbiddenPage from '../error/ForbiddenPage';

/**
 * PrivateRoute — RBAC & Authentication Boundary Guard (HOC).
 *
 * This component enforces two independent access control layers:
 *
 *   LAYER 1 — Authentication Gate:
 *     Reads `token` from authStore. If absent (unauthenticated), issues a
 *     hard redirect to /login, preserving the original intended location in
 *     router state (`state.from`) for post-login redirect restoration.
 *
 *   LAYER 2 — First-Login Redirect:
 *     If `firstLogin === true` and `skipFirstLoginCheck` is NOT set, the user
 *     is unconditionally redirected to /change-password. This enforces the
 *     mandatory initial password change before any system access is granted.
 *     The /change-password route itself MUST use `skipFirstLoginCheck={true}`
 *     to prevent an infinite redirect loop.
 *
 *   LAYER 3 — Role-Based Access Control (RBAC):
 *     If `allowedRoles` is non-empty, the user's normalized SystemRole
 *     (`systemRole` or `role` claim) is validated against the array.
 *     A mismatch renders <ForbiddenPage /> inline
 *     WITHOUT navigating away — the URL is preserved to assist debugging.
 *     Navigation to /error/403 is handled separately by the Axios interceptor
 *     for server-side ABAC rejections.
 *
 * Usage patterns:
 *
 *   A) As a React Router v7 pathless layout route element (preferred):
 *      { element: <PrivateRoute allowedRoles={['RESEARCHER']} />, children: [...] }
 *      In this pattern, PrivateRoute renders <Outlet /> for allowed users.
 *
 *   B) As an inline wrapper around a page element:
 *      element: <PrivateRoute allowedRoles={['ADMIN']}><AdminPage /></PrivateRoute>
 *      In this pattern, PrivateRoute renders {children}.
 *
 * @param {string[]} allowedRoles         - SystemRole values permitted. Empty array = any authenticated role.
 * @param {boolean}  skipFirstLoginCheck  - If true, bypasses the firstLogin → /change-password redirect.
 * @param {ReactNode} [children]          - Optional children (Pattern B). Defaults to <Outlet /> (Pattern A).
 */
export default function PrivateRoute({
  allowedRoles = [],
  skipFirstLoginCheck = false,
  children,
}) {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const firstLogin = useAuthStore((s) => s.firstLogin);
  const role = useAuthStore((s) => s.getRole());

  // ── LAYER 1: Authentication ────────────────────────────────────────────────
  if (!token) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // ── LAYER 2: First-Login Force Redirect ────────────────────────────────────
  if (!skipFirstLoginCheck && firstLogin) {
    return <Navigate to="/change-password" replace />;
  }

  // ── LAYER 3: Role-Based Access Control ────────────────────────────────────
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <ForbiddenPage />;
  }

  // ── AUTHORISED: Render child route tree or wrapped children ───────────────
  return children ? <>{children}</> : <Outlet />;
}
