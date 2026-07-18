/**
 * navigationRef — Imperative navigation bridge for non-React contexts.
 *
 * Problem: The Axios response interceptor executes outside the React component
 * tree and therefore cannot call useNavigate() directly (a React hook).
 *
 * Solution: This module exposes a mutable reference object. The <RouterSetter>
 * component (rendered inside the RouterProvider context in main.jsx) calls
 * setNavigate() on mount, seeding this reference with the real navigate function
 * from useNavigate(). The Axios interceptor then calls navigate() safely.
 *
 * Fallback: If the router has not yet mounted (e.g., during static initialisation
 * at module load time), navigate() falls back to window.location.href assignment
 * to ensure error boundaries are still reachable.
 *
 * Usage in Axios interceptor:
 *   import { navigate } from '../utils/navigationRef';
 *   navigate('/error/403');
 *
 * Usage in RouterSetter component:
 *   import { setNavigate } from '../utils/navigationRef';
 *   const nav = useNavigate();
 *   useEffect(() => { setNavigate(nav); }, [nav]);
 */

let _navigateFn = null;

/**
 * Seed the reference with the live useNavigate() return value.
 * Must be called exactly once from a component that is a descendant of
 * <RouterProvider>.
 * @param {Function} fn - The navigate function from useNavigate()
 */
export function setNavigate(fn) {
  _navigateFn = fn;
}

/**
 * Programmatically navigate from outside the React component tree.
 * Accepts the same arguments as React Router's navigate() function.
 * @param {string} to         - Target path (e.g. '/error/403')
 * @param {Object} [options]  - React Router NavigateOptions (replace, state, etc.)
 */
export function navigate(to, options) {
  if (_navigateFn) {
    _navigateFn(to, options);
  } else {
    window.location.href = to;
  }
}
