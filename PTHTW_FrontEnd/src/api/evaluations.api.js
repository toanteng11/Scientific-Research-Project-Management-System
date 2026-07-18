import axiosInstance from './axiosInstance';

export const evaluationsApi = {
  submit: (data) =>
    axiosInstance.post('/api/v1/evaluations', data),

  getMyEvaluation: (topicId, councilMemberId) =>
    axiosInstance.get('/api/v1/evaluations/me', {
      params: { topicId, councilMemberId },
    }),
};
