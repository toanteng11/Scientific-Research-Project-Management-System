import { create } from 'zustand';

/**
 * uiStore — Global UI state slice.
 *
 * Manages:
 *   isGlobalLoading : Boolean overlay for blocking full-page network operations.
 *   toasts          : Ordered queue of toast notification descriptors consumed by
 *                     the <ToastProvider /> component in the AppShell layout.
 *
 * NOT persisted — UI state is session-transient by design.
 *
 * Toast descriptor shape:
 *   { id: string, type: 'success'|'error'|'warning'|'info', message: string, duration: number }
 */
const useUiStore = create((set) => ({
  isGlobalLoading: false,
  toasts: [],

  /**
   * Enable/disable the global loading overlay.
   * The response interceptor calls setGlobalLoading(true) before a retry
   * and setGlobalLoading(false) after resolution.
   */
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  /**
   * Enqueue a toast notification.
   * @param {Object} toast
   * @param {string} [toast.id]       - Auto-generated via Date.now() if omitted.
   * @param {'success'|'error'|'warning'|'info'} toast.type
   * @param {string} toast.message
   * @param {number} [toast.duration] - Milliseconds before auto-dismiss (default 5000).
   */
  addToast: ({ id, type, message, duration = 5000 }) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          message,
          duration,
        },
      ],
    })),

  /**
   * Dequeue a specific toast by id. Called by the toast component's
   * onOpenChange handler after the auto-dismiss timer fires.
   */
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  /**
   * Flush all toasts from the queue. Typically called on route change
   * to prevent stale error toasts persisting across navigation events.
   */
  clearToasts: () => set({ toasts: [] }),
}));

export default useUiStore;
