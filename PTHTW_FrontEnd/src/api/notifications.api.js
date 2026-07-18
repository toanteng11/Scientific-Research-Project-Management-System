import axiosInstance from './axiosInstance';

export const notificationsApi = {
  getMyNotifications: (params = {}) =>
    axiosInstance.get('/api/v1/notifications/me', { params }),

  getUnreadCount: () =>
    axiosInstance.get('/api/v1/notifications/me/unread-count'),

  markAsRead: (id) =>
    axiosInstance.patch(`/api/v1/notifications/${id}/read`),

  markAllAsRead: () =>
    axiosInstance.patch('/api/v1/notifications/me/read-all'),
};
