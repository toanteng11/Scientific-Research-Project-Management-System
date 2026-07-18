import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ROLE_DASHBOARD = {
  RESEARCHER: '/researcher/dashboard',
  DEPT_HEAD: '/department/dashboard',
  MANAGER: '/manager/dashboard',
  COUNCIL: '/council/dashboard',
  ADMIN: '/admin/dashboard',
};

/**
 * NotFoundPage — HTTP 404 / Catch-all route boundary.
 *
 * Rendered for any URL that does not match the registered route table.
 * Provides contextual navigation: authenticated users return to their
 * dashboard; unauthenticated users are directed to the login screen.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.getRole());

  const handleHome = () => {
    if (!token) {
      navigate('/login', { replace: true });
    } else {
      navigate(ROLE_DASHBOARD[role] ?? '/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-[96px] font-black text-gray-300 leading-none select-none">
          404
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
          Không tìm thấy trang
        </h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Trang bạn yêu cầu không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <div className="mt-8">
          <button
            onClick={handleHome}
            className="px-6 py-2.5 rounded-md bg-[#1a3a7c] text-white text-sm font-semibold
                       hover:bg-[#15306a] transition-colors duration-150"
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
