import useAuthStore from '../../store/authStore';
import { getRoleLabel } from '../../utils/formatters';

const ROLE_DASHBOARD = {
  RESEARCHER: '/researcher/dashboard',
  DEPT_HEAD: '/department/dashboard',
  MANAGER: '/manager/dashboard',
  COUNCIL: '/council/dashboard',
  ADMIN: '/admin/dashboard',
};

/**
 * ForbiddenPage — HTTP 403 Forbidden boundary.
 *
 * Uses deterministic absolute navigation (window.location) to escape the
 * error state. Avoids navigate(-1) which can loop back to the URL that
 * triggered the 403, creating an infinite redirect cycle.
 */
export default function ForbiddenPage() {
  const role = useAuthStore((s) => s.getRole());
  const roleLabel = getRoleLabel(role) || 'Người dùng';
  const dashboard = ROLE_DASHBOARD[role] ?? '/login';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-[96px] font-black text-[#1a3a7c] leading-none select-none">
          403
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
          Truy cập bị từ chối
        </h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Tài khoản của bạn ({roleLabel}) không có quyền truy cập vào tài nguyên này.
          Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ quản trị viên hệ thống.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { window.location.href = dashboard; }}
            className="px-5 py-2.5 rounded-md bg-[#1a3a7c] text-white text-sm font-semibold
                       hover:bg-[#15306a] transition-colors duration-150"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => { window.location.href = '/login'; }}
            className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold
                       hover:bg-gray-100 transition-colors duration-150"
          >
            Đăng nhập lại
          </button>
        </div>
        <p className="mt-10 text-xs text-gray-400">
          Hệ thống Xét duyệt Nghiên cứu Khoa học — OU
        </p>
      </div>
    </div>
  );
}
