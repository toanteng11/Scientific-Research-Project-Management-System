import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notifications.api';
import useUiStore from '../../store/uiStore';
import { formatRelative } from '../../utils/formatters';

const RESOURCE_ROUTE_MAP = {
  TOPIC: (id, role) => {
    if (role === 'RESEARCHER') return `/researcher/topics/${id}`;
    if (role === 'DEPT_HEAD') return `/department/topics/${id}`;
    if (role === 'MANAGER') return `/manager/topics/${id}`;
    return `/researcher/topics/${id}`;
  },
  COUNCIL: (id) => `/manager/councils/${id}`,
  EVALUATION: () => '/council/dashboard',
  MINUTE: () => '/council/dashboard',
};

export default function NotificationInboxPage() {
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await notificationsApi.getMyNotifications({ page: p, size: 20, sort: 'createdAt,desc' });
      setNotifications(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 0);
    } catch { /* interceptor */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(page); }, [page, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch { /* silent */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      addToast({ type: 'success', message: 'Đã đánh dấu tất cả là đã đọc.' });
    } catch { /* silent */ }
  };

  const handleClick = async (notif) => {
    if (!notif.readAt) await handleMarkAsRead(notif.notificationId);
    const routeFn = RESOURCE_ROUTE_MAP[notif.resourceType];
    if (routeFn) navigate(routeFn(notif.resourceId));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-sm text-gray-500 mt-1">Tất cả thông báo của bạn.</p>
        </div>
        <button onClick={handleMarkAllAsRead}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50">
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border"><p className="text-gray-500">Không có thông báo nào.</p></div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm divide-y">
          {notifications.map((n) => (
            <button key={n.notificationId} onClick={() => handleClick(n)}
              className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors ${!n.readAt ? 'bg-blue-50/40' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.readAt && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    <p className={`text-sm font-medium ${!n.readAt ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.body}</p>
                </div>
                <p className="text-xs text-gray-400 ml-4 flex-shrink-0">{formatRelative(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50">Trước</button>
          <span className="px-3 py-1 text-sm text-gray-500">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50">Sau</button>
        </div>
      )}
    </div>
  );
}
