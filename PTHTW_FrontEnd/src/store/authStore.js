import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { normalizeSystemRole } from '../utils/formatters';

/**
 * authStore — Global authentication state slice.
 *
 * Persisted fields (written to localStorage under key 'pthtw-auth'):
 *   token          : JWT access token (Bearer)
 *   refreshToken   : Opaque refresh token issued by POST /auth/login
 *   userClaims     : Identity payload — { userId?, email, fullName,
 *                    academicTitle?, role | systemRole (SystemRole), departmentId?, firstLogin }
 *   firstLogin     : Mirror of userClaims.firstLogin for quick guard reads.
 *
 * Transient fields (NOT persisted — reset on each page load):
 *   none — all relevant auth state must survive page reloads.
 *
 * Security contract:
 *   clearAuth() is the sole authoritative method for destroying session state.
 *   It must be called (a) on 401 from the response interceptor and
 *   (b) on explicit user logout (POST /auth/logout response received).
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      userClaims: null,
      firstLogin: false,

      /**
       * Hydrate the store after a successful POST /api/v1/auth/login response.
       * @param {Object} params
       * @param {string} params.token        - JWT access token
       * @param {string} params.refreshToken - Refresh token
       * @param {Object} params.userClaims   - { userId, email, fullName, academicTitle,
       *                                        role, departmentId, firstLogin }
       */
      setAuth: ({ token, refreshToken, userClaims }) =>
        set({
          token,
          refreshToken,
          userClaims,
          firstLogin: userClaims?.firstLogin ?? false,
        }),

      /**
       * Rotate the access token in-place after a successful refresh cycle.
       * The refresh token is also rotated if the backend issues a new one.
       * @param {string} newToken           - New JWT access token
       * @param {string|null} newRefresh    - New refresh token (optional rotation)
       */
      rotateToken: (newToken, newRefresh = null) =>
        set((state) => ({
          token: newToken,
          refreshToken: newRefresh ?? state.refreshToken,
        })),

      /**
       * Clears all authentication state. Called by the 401 response interceptor
       * and the logout action. Forces re-authentication on next protected route access.
       */
      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          userClaims: null,
          firstLogin: false,
        }),

      /**
       * Flip firstLogin to false after the user successfully changes their
       * initial password. Prevents the forced redirect loop.
       */
      clearFirstLoginFlag: () =>
        set((state) => ({
          firstLogin: false,
          userClaims: state.userClaims
            ? { ...state.userClaims, firstLogin: false }
            : null,
        })),

      getToken: () => get().token,
      getRefreshToken: () => get().refreshToken,
      getRole: () =>
        normalizeSystemRole(get().userClaims?.systemRole ?? get().userClaims?.role),
      getUserId: () => get().userClaims?.userId ?? null,
      isAuthenticated: () => get().token !== null,
    }),
    {
      name: 'pthtw-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        userClaims: state.userClaims,
        firstLogin: state.firstLogin,
      }),
    }
  )
);

export default useAuthStore;
