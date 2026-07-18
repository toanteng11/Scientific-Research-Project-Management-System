import useAuthStore from '../../store/authStore';

const ROLE_DASHBOARD = {
  RESEARCHER: '/researcher/dashboard',
  DEPT_HEAD: '/department/dashboard',
  MANAGER: '/manager/dashboard',
  COUNCIL: '/council/dashboard',
  ADMIN: '/admin/dashboard',
};

/**
 * QuotaExceededPage — HTTP 402 Payment Required / Resource Quota boundary.
 *
 * Uses deterministic absolute navigation to escape the error state.
 */
export default function QuotaExceededPage() {
  const role = useAuthStore((s) => s.getRole());
  const dashboard = ROLE_DASHBOARD[role] ?? '/login';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-[96px] font-black text-amber-500 leading-none select-none">
          402
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
          Vượt quá giới hạn tài nguyên
        </h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Tài nguyên hoặc ngân sách đã vượt quá giới hạn được phép bởi hệ thống.
          Vui lòng liên hệ quản trị viên để được hỗ trợ.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:phongqlkh@ou.edu.vn"
            className="inline-block px-5 py-2.5 rounded-md bg-amber-500 text-white text-sm font-semibold
                       hover:bg-amber-600 transition-colors duration-150"
          >
            Liên hệ quản trị viên
          </a>
          <button
            onClick={() => { window.location.href = dashboard; }}
            className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold
                       hover:bg-gray-100 transition-colors duration-150"
          >
            Về trang chủ
          </button>
        </div>
        <p className="mt-10 text-xs text-gray-400">
          Hệ thống Xét duyệt Nghiên cứu Khoa học — OU
        </p>
      </div>
    </div>
  );
}
