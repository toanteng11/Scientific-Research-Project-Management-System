/**
 * postLoginNavigation — Role-safe destination resolution after authentication.
 *
 * Restores deep links only when the authenticated subject's system role may
 * legitimately access the target pathname. Otherwise returns the canonical
 * role dashboard, preventing cross-persona URL retention from `location.state.from`.
 */

export const ROLE_DASHBOARD = {
  RESEARCHER: '/researcher/dashboard',
  DEPT_HEAD: '/department/dashboard',
  MANAGER: '/manager/dashboard',
  COUNCIL: '/council/dashboard',
  ADMIN: '/admin/dashboard',
};

const ROLE_PREFIXES = {
  RESEARCHER: ['/researcher'],
  DEPT_HEAD: ['/department'],
  MANAGER: ['/manager'],
  COUNCIL: ['/council'],
  ADMIN: ['/admin'],
};

const SHARED_PREFIXES = ['/profile', '/notifications', '/change-password'];

/**
 * @param {string} pathname
 * @param {string|null|undefined} role
 * @returns {boolean}
 */
export function isPathAllowedForRole(pathname, role) {
  if (!pathname || !role || !ROLE_PREFIXES[role]) return false;
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (SHARED_PREFIXES.some((p) => normalized === p || normalized.startsWith(`${p}/`))) {
    return true;
  }
  const prefixes = ROLE_PREFIXES[role];
  return prefixes.some((p) => normalized === p || normalized.startsWith(`${p}/`));
}

/**
 * @param {string} role — SystemRole from JWT claims
 * @param {string|undefined} fromPathname — Prior route from PrivateRoute redirect state
 * @returns {string}
 */
export function resolvePostLoginDestination(role, fromPathname) {
  const dashboard = ROLE_DASHBOARD[role] ?? '/login';
  if (!fromPathname || fromPathname === '/login') return dashboard;
  if (isPathAllowedForRole(fromPathname, role)) return fromPathname;
  return dashboard;
}

/**
 * Performs a full document navigation to the target path, synchronising the
 * browser location with the post-authentication persona. Used after login
 * (and optionally after registration flows) to avoid stale SPA history.
 *
 * @param {string} path — Absolute path within the app (e.g. /admin/dashboard)
 */
export function hardNavigateAfterAuth(path) {
  const url = path.startsWith('/') ? path : `/${path}`;
  window.location.replace(url);
}
