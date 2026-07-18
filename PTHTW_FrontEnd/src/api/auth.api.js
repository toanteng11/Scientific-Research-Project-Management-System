import axiosInstance from './axiosInstance';

/**
 * auth.api.js — Authentication & Identity Management API module.
 *
 * All functions return Axios PromiseReturns are raw AxiosResponse objects.
 * Callers must access `.data` for the response payload.
 *
 * Error handling is delegated to the global response interceptor in
 * axiosInstance.js for 401/403/409/5xx. The caller is responsible for
 * handling 400 (field-level validation) via react-hook-form setError().
 */
export const authApi = {
  /**
   * POST /api/v1/auth/login
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<AxiosResponse<AuthResponse>>}
   */
  login: (credentials) =>
    axiosInstance.post('/api/v1/auth/login', credentials),

  /**
   * POST /api/v1/auth/logout
   * Requires: Authorization Bearer header (injected by request interceptor).
   * Returns: 204 No Content.
   * @returns {Promise<AxiosResponse<void>>}
   */
  logout: () =>
    axiosInstance.post('/api/v1/auth/logout'),

  /**
   * POST /api/v1/auth/forgot-password
   * @param {{ email: string }} data
   * @returns {Promise<AxiosResponse<void>>} 204 on success (idempotent)
   */
  forgotPassword: (data) =>
    axiosInstance.post('/api/v1/auth/forgot-password', data),

  /**
   * POST /api/v1/auth/reset-password
   * @param {{ token: string, newPassword: string }} data
   * @returns {Promise<AxiosResponse<void>>} 204 on success
   */
  resetPassword: (data) =>
    axiosInstance.post('/api/v1/auth/reset-password', data),

  /**
   * GET /api/v1/auth/me
   * Returns the full UserResponse for the authenticated user.
   * Fields: userId, email, fullName, academicTitle, systemRole,
   *         firstLogin, active, departmentName
   * @returns {Promise<AxiosResponse<UserResponse>>}
   */
  getMe: () =>
    axiosInstance.get('/api/v1/auth/me'),

  /**
   * PATCH /api/v1/auth/profile
   * @param {{ fullName?: string, academicTitle?: string }} data
   * @returns {Promise<AxiosResponse<UserResponse>>}
   */
  updateProfile: (data) =>
    axiosInstance.patch('/api/v1/auth/profile', data),

  /**
   * PATCH /api/v1/auth/password
   * Clears the firstLogin flag on success (server-side).
   * After calling this, the client must call authStore.clearFirstLoginFlag().
   * @param {{ currentPassword: string, newPassword: string }} data
   * @returns {Promise<AxiosResponse<void>>} 204 No Content
   */
  updatePassword: (data) =>
    axiosInstance.patch('/api/v1/auth/password', data),
};
