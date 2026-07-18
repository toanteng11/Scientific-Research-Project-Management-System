import axios from 'axios';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import { navigate } from '../utils/navigationRef';

/**
 * SPRING BOOT API GATEWAY BASE URL
 *
 * All versioned REST endpoints are prefixed with /api/v1 on the server side.
 * The base URL points to the root of the Spring Boot application.
 * In production it can stay empty when the backend is routed on the same
 * Vercel domain through /api rewrites. Set VITE_API_BASE_URL only when the
 * backend is hosted on a separate domain.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * axiosInstance — Centralised Axios singleton.
 *
 * Configuration:
 *   baseURL    : Spring Boot API gateway root.
 *   timeout    : Configurable via VITE_API_TIMEOUT_MS. Production allows enough
 *                time for a cold Spring Boot container to become ready.
 *   headers    : Content-Type defaults to application/json. Multipart requests must
 *                override this per-call by passing { headers: { 'Content-Type': undefined } }
 *                to allow Axios to auto-set the multipart boundary.
 *
 * Interceptors are attached immediately after instance creation (see below).
 */
const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
const REQUEST_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout
  : (import.meta.env.PROD ? 180000 : 15000);

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN REFRESH STATE
//
// isRefreshing    : Mutex flag. TRUE while a refresh cycle is in-flight.
//                   Prevents concurrent 401 responses from spawning multiple
//                   simultaneous POST /api/v1/auth/refresh requests.
// refreshQueue    : Queue of pending Promise resolvers. All requests that
//                   received a 401 during a refresh cycle are suspended here.
//                   They are drained (retried with the new token) once the
//                   refresh cycle resolves, or rejected if it fails.
// ─────────────────────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

/**
 * Mandatory session boundary: purge persisted auth state then replace navigation to /login.
 * Invoked on HTTP 401 when refresh is impossible or refresh fails (stateless client contract).
 */
function purgeSessionAndRedirectToLogin() {
  useAuthStore.getState().clearAuth();
  navigate('/login', { replace: true });
}

/**
 * Drain the refresh queue.
 * @param {string|null} newToken  - New JWT if refresh succeeded; null if it failed.
 * @param {Error|null}  err       - Error if refresh failed; null if it succeeded.
 */
function drainRefreshQueue(newToken, err) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (err) {
      reject(err);
    } else {
      resolve(newToken);
    }
  });
  refreshQueue = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINT WHITELIST
//
// Requests targeting these URL prefixes are permitted to proceed without a JWT.
// All other outbound requests to the Spring Boot backend MUST carry a valid
// Bearer token. If no token is present and the target is not whitelisted, the
// request is aborted immediately and the user is redirected to /login.
// ─────────────────────────────────────────────────────────────────────────────
const PUBLIC_PATH_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/register-test',
];

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR — JWT Bearer Token Injection & Unauthenticated Gate
//
// Before every outbound request:
//   1. Read the current access token from authStore.
//   2. If a token exists, inject it as the Authorization header.
//   3. If NO token exists and the target URL is NOT a whitelisted public path,
//      abort the request immediately (return Promise.reject) and issue a hard
//      redirect to /login. This prevents unauthenticated API calls from ever
//      reaching the backend for protected resources.
// ─────────────────────────────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      return config;
    }

    // No token — determine whether the target path is a public endpoint.
    const url = config.url ?? '';
    const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) => url.startsWith(prefix));
    if (!isPublicPath) {
      navigate('/login', { replace: true });
      return Promise.reject(
        Object.assign(new Error('UNAUTHENTICATED: No JWT present. Request aborted.'), {
          code: 'ERR_UNAUTHENTICATED',
        })
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR — Centralised Error Routing Matrix
//
// Maps HTTP status codes emitted by the Spring Boot backend to the
// appropriate client-side handler as defined in Section 4.3 of the
// Frontend Architecture Audit Report.
//
// Status | Action
// ────────────────────────────────────────────────────────────────────────────
// 2xx    | Pass through — caller receives the full AxiosResponse.
// 400    | Reject promise — caller extracts error.response.data.errors[]
//        | and calls react-hook-form setError() to populate field-level
//        | inline validation messages. NO navigation occurs.
// 401    | Attempt silent token refresh via POST /api/v1/auth/refresh.
//        | Queue all concurrent 401 requests until refresh resolves.
//        | On refresh success: retry the original request with new token.
//        | On refresh failure: purgeSessionAndRedirectToLogin() (clearAuth + /login replace).
// 403    | navigate('/error/403') — Forbidden / ABAC rejection.
// 402    | navigate('/error/402') — Resource quota / budget limit.
// 409    | navigate('/error/409', { state: { message } }) — FSM conflict.
// 5xx    | navigate('/error/500') — Unhandled server exception.
// ─────────────────────────────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const { response, config: originalConfig } = error;

    if (!response) {
      useUiStore.getState().addToast({
        type: 'error',
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
      });
      return Promise.reject(error);
    }

    const { status, data } = response;

    // ── 400 Bad Request ─────────────────────────────────────────────────────
    // Return the rejection with the full response attached.
    // The consuming form component is responsible for iterating data.errors[]
    // and calling react-hook-form's setError() to surface field-level feedback.
    // DO NOT navigate away from the current page.
    if (status === 400) {
      return Promise.reject(error);
    }

    // ── 401 Unauthorised — Silent Refresh + Queue Mechanism ─────────────────
    if (status === 401) {
      const refreshToken = useAuthStore.getState().getRefreshToken();

      // If no refresh token exists (e.g., user never logged in, or refresh
      // token itself is expired), abort immediately and force re-login.
      if (!refreshToken || originalConfig._isRetry) {
        purgeSessionAndRedirectToLogin();
        return Promise.reject(error);
      }

      // Mark original config to prevent infinite retry loops.
      originalConfig._isRetry = true;

      if (isRefreshing) {
        // Another refresh is already in-flight; queue this request.
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalConfig.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosInstance(originalConfig);
        });
      }

      // Initiate the refresh cycle.
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: REQUEST_TIMEOUT_MS,
          }
        );

        const { accessToken: newToken, refreshToken: newRefreshToken } =
          refreshResponse.data;

        useAuthStore.getState().rotateToken(newToken, newRefreshToken ?? null);
        drainRefreshQueue(newToken, null);
        isRefreshing = false;

        originalConfig.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosInstance(originalConfig);
      } catch (refreshError) {
        drainRefreshQueue(null, refreshError);
        isRefreshing = false;
        purgeSessionAndRedirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    // ── 402 Payment Required / Resource Quota ───────────────────────────────
    if (status === 402) {
      navigate('/error/402');
      return Promise.reject(error);
    }

    // ── 403 Forbidden / ABAC Rejection ──────────────────────────────────────
    if (status === 403) {
      navigate('/error/403');
      return Promise.reject(error);
    }

    // ── 409 Conflict ────────────────────────────────────────────────────────
    // Three distinct 409 sources exist:
    //   (a) FSM state-machine violations (PATCH /status) — hard navigate to
    //       error boundary because the user's action is irrecoverable.
    //   (b) Semantic duplication on topic creation (POST /topics) — the user
    //       must revise the title. Navigating away would destroy form state.
    //   (c) GET requests returning 409 (e.g., department context conflict) —
    //       the component should handle gracefully without hard navigation.
    //
    // Heuristic: only PATCH/PUT mutating requests hard-navigate to error page.
    // GET and POST propagate to the component-level catch handler.
    if (status === 409) {
      const method = (originalConfig?.method || '').toUpperCase();
      if (method === 'GET' || method === 'POST') {
        return Promise.reject(error);
      }
      navigate('/error/409', {
        state: { message: data?.message ?? 'Thao tác mâu thuẫn với trạng thái hiện tại.' },
      });
      return Promise.reject(error);
    }

    // ── 5xx Server Errors ────────────────────────────────────────────────────
    if (status >= 500) {
      navigate('/error/500');
      return Promise.reject(error);
    }

    // ── All other 4xx (404, etc.) ────────────────────────────────────────────
    return Promise.reject(error);
  }
);

export default axiosInstance;
