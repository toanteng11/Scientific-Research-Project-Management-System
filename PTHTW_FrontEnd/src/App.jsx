/**
 * App.jsx — Phase 1/2 infrastructure bootstrap placeholder.
 *
 * The previous implementation rendered a single static page component
 * wired to mock data. That import chain has been severed as part of
 * Phase 1 (Mock Data Purge, Task 1.2).
 *
 * This placeholder will be replaced in Phase 3 with <RouterProvider>
 * wrapping the complete 36-route createBrowserRouter configuration,
 * <RouterSetter> for navigation ref seeding, and the <ToastProvider>
 * for global notification rendering.
 *
 * The infrastructure modules created in Phases 1 and 2 are ready
 * for consumption:
 *   - src/store/authStore.js    (Zustand + persist)
 *   - src/store/uiStore.js      (Zustand transient UI state)
 *   - src/api/axiosInstance.js  (Axios singleton + interceptors)
 *   - src/utils/navigationRef.js (imperative navigation bridge)
 */
function App() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-gray-800">
          Hệ thống Quản lý Đề tài NCKH
        </h1>
        <p className="text-sm text-gray-500">
          Phase 1 &amp; 2 infrastructure initialised. Router configuration pending (Phase 3).
        </p>
      </div>
    </div>
  );
}

export default App;
