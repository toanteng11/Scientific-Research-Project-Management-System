import useAuthStore from '../../store/authStore';

const ROLE_DASHBOARD = {
  RESEARCHER: '/researcher/dashboard',
  DEPT_HEAD: '/department/dashboard',
  MANAGER: '/manager/dashboard',
  COUNCIL: '/council/dashboard',
  ADMIN: '/admin/dashboard',
};

/**
 * ServerErrorPage — HTTP 5xx or client render failure fallback.
 *
 * Default: rendered when the Axios interceptor receives a 500+ response.
 * When isClientCrash is true: rendered by GlobalErrorBoundary after a render-phase
 * exception. Uses deterministic absolute navigation (window.location) to escape
 * the error state without relying on SPA history which may be corrupted.
 */
export default function ServerErrorPage({ isClientCrash = false } = {}) {
  const role = useAuthStore((s) => s.getRole());
  const dashboard = ROLE_DASHBOARD[role] ?? '/login';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-[96px] font-black text-red-500 leading-none select-none">
          {isClientCrash ? '!' : '500'}
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
          {isClientCrash ? 'Lỗi giao diện' : 'Lỗi máy chủ'}
        </h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          {isClientCrash
            ? 'Ứng dụng gặp lỗi hiển thị. Vui lòng tải lại trang hoặc quay về trang chủ. Nếu lỗi lặp lại, hãy liên hệ bộ phận hỗ trợ.'
            : 'Hệ thống gặp sự cố không mong muốn trong quá trình xử lý yêu cầu. Đội kỹ thuật đã được thông báo. Vui lòng thử lại sau vài phút.'}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { window.location.href = dashboard; }}
            className="px-5 py-2.5 rounded-md bg-red-600 text-white text-sm font-semibold
                       hover:bg-red-700 transition-colors duration-150"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold
                       hover:bg-gray-100 transition-colors duration-150"
          >
            Thử lại
          </button>
        </div>
        <p className="mt-10 text-xs text-gray-400">
          Hệ thống Xét duyệt Nghiên cứu Khoa học — OU
        </p>
      </div>
    </div>
  );
}
