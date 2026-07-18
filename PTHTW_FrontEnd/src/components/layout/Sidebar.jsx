import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { getRoleLabel, normalizeSystemRole } from '../../utils/formatters';

const NAV_ITEMS_BY_ROLE = {
  RESEARCHER: [
    { label: 'Trang chủ', to: '/researcher/dashboard' },
    { label: 'Nộp đề tài', to: '/researcher/topics/new' },
  ],
  DEPT_HEAD: [
    { label: 'Trang chủ', to: '/department/dashboard' },
  ],
  MANAGER: [
    { label: 'Trang chủ', to: '/manager/dashboard' },
    { label: 'Tất cả đề tài', to: '/manager/topics' },
    { label: 'Quản lý Hội đồng', to: '/manager/councils' },
    { label: 'Thống kê', to: '/manager/stats' },
    { label: 'Mẫu email hệ thống', to: '/manager/email-templates' },
  ],
  COUNCIL: [
    { label: 'Trang chủ', to: '/council/dashboard' },
  ],
  ADMIN: [
    { label: 'Trang chủ', to: '/admin/dashboard' },
    { label: 'Quản lý tài khoản', to: '/admin/users' },
    { label: 'Thống kê', to: '/admin/stats' },
    { label: 'Mẫu email hệ thống', to: '/admin/email-templates' },
  ],
};

const COMMON_ITEMS = [
  { label: 'Hồ sơ cá nhân', to: '/profile' },
  { label: 'Thông báo', to: '/notifications' },
  { label: 'Đổi mật khẩu', to: '/change-password' },
];

/**
 * Sidebar — Role-aware persistent navigation panel.
 *
 * Renders role-specific primary navigation links above a universal
 * section containing profile, notifications, and password management.
 * The logout action delegates to useAuth().logout().
 */
export default function Sidebar() {
  const userClaims = useAuthStore((s) => s.userClaims);
  const { logout } = useAuth();
  const systemRole = normalizeSystemRole(userClaims?.systemRole ?? userClaims?.role);
  const roleLabel = getRoleLabel(systemRole) || 'Người dùng';
  const role = systemRole;
  const roleItems = NAV_ITEMS_BY_ROLE[role] ?? [];

  const baseLinkClass =
    'block px-4 py-2.5 rounded-md text-sm font-medium transition-colors duration-150';
  const activeLinkClass = 'bg-white/15 text-white';
  const inactiveLinkClass = 'text-white/70 hover:bg-white/10 hover:text-white';

  const linkClass = ({ isActive }) =>
    `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`;

  return (
    <aside className="w-64 min-h-screen bg-[#1a3a7c] flex flex-col flex-shrink-0">
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
          Trường Đại học Mở TP.HCM
        </p>
        <h1 className="mt-1 text-[13px] font-bold text-white leading-snug">
          Hệ thống Xét duyệt<br />Nghiên cứu Khoa học
        </h1>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3 border-b border-white/10">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold
                         bg-[#4a8fe8] text-white tracking-wide">
          {roleLabel}
        </span>
        {userClaims?.fullName && (
          <p className="mt-1 text-[12px] text-white/80 truncate" title={userClaims.fullName}>
            {userClaims.fullName}
          </p>
        )}
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {roleItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} end={item.to.endsWith('dashboard')}>
            {item.label}
          </NavLink>
        ))}

        {/* Divider */}
        {roleItems.length > 0 && (
          <div className="border-t border-white/10 my-3" />
        )}

        {/* Common links */}
        {COMMON_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full px-4 py-2.5 rounded-md text-sm font-medium text-white/70
                     hover:bg-white/10 hover:text-white transition-colors duration-150 text-left"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
