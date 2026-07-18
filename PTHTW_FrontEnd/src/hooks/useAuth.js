import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import { authApi } from '../api/auth.api';
import {
  ROLE_DASHBOARD,
  hardNavigateAfterAuth,
} from '../utils/postLoginNavigation';

/**
 * useAuth — Composite authentication hook.
 *
 * Provides a unified surface for reading auth state and performing
 * auth-related side effects (logout, role-based navigation).
 *
 * Consumers should import this hook rather than calling useAuthStore
 * directly wherever logout or navigation logic is required.
 */
export function useAuth() {
  const addToast = useUiStore((s) => s.addToast);

  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const userClaims = useAuthStore((s) => s.userClaims);
  const firstLogin = useAuthStore((s) => s.firstLogin);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearFirstLoginFlag = useAuthStore((s) => s.clearFirstLoginFlag);

  const isAuthenticated = Boolean(token);
  const role = useAuthStore((s) => s.getRole());

  /**
   * Map SystemRole enum values to their role-specific dashboard paths.
   */
  const ROLE_DASHBOARD_MAP = ROLE_DASHBOARD;

  /**
   * Navigate the current user to their role-appropriate dashboard.
   * Full document navigation keeps the location bar aligned with RBAC.
   * Falls back to /login if role is unrecognised.
   */
  const navigateToDashboard = () => {
    const path = ROLE_DASHBOARD_MAP[role] ?? '/login';
    hardNavigateAfterAuth(path);
  };

  /**
   * Perform a full logout:
   * 1. Call POST /api/v1/auth/logout (revokes JWT server-side).
   * 2. Clear local auth state unconditionally (even if the API call fails).
   * 3. Hard-redirect to /login using window.location to destroy the
   *    entire SPA history stack. This prevents back-navigation into
   *    stale role-scoped URLs after re-authentication as a different persona.
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore — always clear local state regardless of server response.
    } finally {
      clearAuth();
      addToast({ type: 'success', message: 'Đăng xuất thành công.' });
      window.location.replace('/login');
    }
  };

  return {
    token,
    refreshToken,
    userClaims,
    firstLogin,
    isAuthenticated,
    role,
    clearFirstLoginFlag,
    navigateToDashboard,
    logout,
    ROLE_DASHBOARD_MAP,
  };
}
