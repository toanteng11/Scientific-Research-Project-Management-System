import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '../api/notifications.api';
import useAuthStore from '../store/authStore';

const POLL_INTERVAL = 60000;

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((s) => s.token);
  const intervalRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, [token]);

  const fetchNotifications = useCallback(async (params = { page: 0, size: 10 }) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await notificationsApi.getMyNotifications(params);
      setNotifications(res.data?.content ?? []);
      return res.data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchUnreadCount]);

  return { unreadCount, notifications, loading, fetchUnreadCount, fetchNotifications, markAsRead, markAllAsRead };
}
