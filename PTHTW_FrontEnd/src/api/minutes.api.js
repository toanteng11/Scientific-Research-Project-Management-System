import axiosInstance from './axiosInstance';

export const minutesApi = {
  /** @deprecated use draft() / approve() instead */
  submit: (data) =>
    axiosInstance.post('/api/v1/minutes', data),

  draft: (data) =>
    axiosInstance.post('/api/v1/minutes/draft', data),

  approve: (minuteId, { finalDecision, legalConfirmation }) =>
    axiosInstance.patch(`/api/v1/minutes/${minuteId}/approve`, {
      finalDecision,
      legalConfirmation,
    }),

  returnToSecretary: (minuteId, reason) =>
    axiosInstance.patch(`/api/v1/minutes/${minuteId}/return`, { reason }),

  getByTopicId: (topicId) =>
    axiosInstance.get(`/api/v1/minutes/topic/${topicId}`),
};
