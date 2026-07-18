import axiosInstance from './axiosInstance';
import { fetchAllSpringPageContents } from '../utils/pagination';

export const topicsApi = {
  create: (data) =>
    axiosInstance.post('/api/v1/topics/', data),

  uploadAttachment: (topicId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(`/api/v1/topics/${topicId}/attachments`, formData, {
      headers: { 'Content-Type': undefined },
    });
  },

  update: (id, data) =>
    axiosInstance.put(`/api/v1/topics/${id}`, data),

  getMyTopics: (params = {}) =>
    axiosInstance.get('/api/v1/topics/me', { params }),

  getAll: (params = {}) =>
    axiosInstance.get('/api/v1/topics/', { params }),

  fetchAllTopics: (extra = {}) =>
    fetchAllSpringPageContents((p) =>
      axiosInstance.get('/api/v1/topics/', { params: { sort: 'topicId,desc', ...p, ...extra } }),
    ),

  getById: (id) =>
    axiosInstance.get(`/api/v1/topics/${id}`),

  deleteTopic: (id) =>
    axiosInstance.delete(`/api/v1/topics/${id}`),

  // PENDING_REVIEW maps to wire value "PENDING_DEPT" (Jackson @JsonProperty on backend enum).
  changeStatus: (id, { targetStatus, feedbackMessage }) => {
    const wireTargetStatus =
      targetStatus === 'PENDING_REVIEW' ? 'PENDING_DEPT' : targetStatus;
    const payload = { targetStatus: wireTargetStatus };
    if (feedbackMessage != null && String(feedbackMessage).length > 0) {
      payload.feedbackMessage = feedbackMessage;
    }
    return axiosInstance.patch(`/api/v1/topics/${id}/status`, payload);
  },

  getAuditLogs: (id) =>
    axiosInstance.get(`/api/v1/topics/${id}/audit-logs`),

  getAverageScore: (id) =>
    axiosInstance.get(`/api/v1/topics/${id}/average-score`),

  downloadAttachment: (topicId, attachmentId) =>
    axiosInstance.get(`/api/v1/topics/${topicId}/attachments/${attachmentId}`, {
      responseType: 'blob',
    }),
};
