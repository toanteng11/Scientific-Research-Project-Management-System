import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelative, getRoleLabel, normalizeSystemRole } from '../../utils/formatters';

const RESOURCE_ROUTE_MAP = {
  TOPIC: (id) => `/researcher/topics/${id}`,
  COUNCIL: (id) => `/manager/councils/${id}`,
  EVALUATION: () => '/council/dashboard',
  MINUTE: () => '/council/dashboard',
};

export default function TopBar() {
  const navigate = useNavigate();
  const userClaims = useAuthStore((s) => s.userClaims);
  const systemRole = normalizeSystemRole(userClaims?.systemRole ?? userClaims?.role);
  const roleLabel = getRoleLabel(systemRole);

  const { unreadCount, notifications, fetchNotifications, markAsRead } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = async () => {
    if (!dropdownOpen) {
      await fetchNotifications({ page: 0, size: 10 });
    }
    setDropdownOpen(!dropdownOpen);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.readAt) {
      await markAsRead(notif.notificationId);
    }
    setDropdownOpen(false);
    const routeFn = RESOURCE_ROUTE_MAP[notif.resourceType];
    if (routeFn) {
      navigate(routeFn(notif.resourceId));
    } else {
      navigate('/notifications');
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
      <div className="flex-1 text-sm font-semibold text-gray-600 tracking-wide">
        Hệ thống Xét duyệt Nghiên cứu Khoa học
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors duration-150"
            title="Thông báo"
            aria-label="Xem thông báo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50">
                <span className="text-xs font-semibold text-gray-700">Thông báo</span>
                <Link to="/notifications" onClick={() => setDropdownOpen(false)} className="text-xs text-blue-600 hover:underline">Xem tất cả</Link>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">Không có thông báo mới.</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.notificationId}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!n.readAt ? 'bg-blue-50/50' : ''}`}
                    >
                      <p className={`text-xs font-medium ${!n.readAt ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User identity */}
        <Link
          to="/profile"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors duration-150"
        >
          <div className="w-7 h-7 rounded-full bg-[#1a3a7c] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userClaims?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="text-right leading-none">
            <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">
              {userClaims?.fullName ?? 'Người dùng'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">{roleLabel}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
