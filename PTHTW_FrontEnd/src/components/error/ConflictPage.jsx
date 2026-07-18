import { useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ROLE_DASHBOARD = {
  RESEARCHER: '/researcher/dashboard',
  DEPT_HEAD: '/department/dashboard',
  MANAGER: '/manager/dashboard',
  COUNCIL: '/council/dashboard',
  ADMIN: '/admin/dashboard',
};

/**
 * ConflictPage — HTTP 409 Conflict boundary.
 *
 * Uses deterministic absolute navigation to escape the error state.
 */
export default function ConflictPage() {
  const location = useLocation();
  const role = useAuthStore((s) => s.getRole());
  const dashboard = ROLE_DASHBOARD[role] ?? '/login';
  const message =
    location.state?.message ??
    'Thao tác này mâu thuẫn với trạng thái hiện tại của dữ liệu. Vui lòng tải lại trang và thử lại.';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-[96px] font-black text-orange-500 leading-none select-none">
          409
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
          Xung đột trạng thái
        </h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed bg-orange-50 border border-orange-200
                      rounded-md px-4 py-3">
          {message}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { window.location.href = dashboard; }}
            className="px-5 py-2.5 rounded-md bg-orange-500 text-white text-sm font-semibold
                       hover:bg-orange-600 transition-colors duration-150"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold
                       hover:bg-gray-100 transition-colors duration-150"
          >
            Tải lại trang
          </button>
        </div>
        <p className="mt-10 text-xs text-gray-400">
          Hệ thống Xét duyệt Nghiên cứu Khoa học — OU
        </p>
      </div>
    </div>
  );
}
