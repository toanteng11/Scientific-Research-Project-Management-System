import axiosInstance from './axiosInstance';

export const councilsApi = {
  // SỬA LỖI: Xóa dấu '/' ở cuối URL để khớp với Backend, tránh lỗi 404
  create: (data) =>
    axiosInstance.post('/api/v1/councils', data),

  createCouncil: (data) =>
    axiosInstance.post('/api/v1/councils', data),

  getAll: (params = {}) =>
    axiosInstance.get('/api/v1/councils', { params }),

  // ---------- [VÁ LỖI CỐT LÕI] ----------
  // Bỏ sử dụng fetchAllSpringPageContents tiềm ẩn rủi ro
  // Gọi trực tiếp API với size lớn và bóc tách mảng content an toàn
  fetchAllCouncils: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/councils/available', {
        params: { page: 0, size: 1000, sort: 'councilId,desc' } 
      });
      // Đảm bảo luôn trả về 1 mảng (Array)
      return response.data?.content || response.data || [];
    } catch (error) {
      console.error("Lỗi API fetchAllCouncils:", error);
      return []; // Trả về mảng rỗng nếu lỗi, tránh sập UI
    }
  },
  // ---------------------------------------

  // Bổ sung API Giao dịch phức hợp (đã làm ở các phiên trước để màn Chi tiết không bị lỗi)
  createAndAssign: (data) => 
    axiosInstance.post('/api/v1/councils/create-and-assign', data),

  getById: (id) =>
    axiosInstance.get(`/api/v1/councils/${id}`),

  assignMembers: (councilId, membersData) =>
    axiosInstance.post(`/api/v1/councils/${councilId}/members`, membersData),

  removeMember: (councilId, userId) =>
    axiosInstance.delete(`/api/v1/councils/${councilId}/members/${userId}`),

  assignTopics: (councilId, topicIds) =>
    axiosInstance.post(`/api/v1/councils/${councilId}/topics`, { topicIds }),

  removeTopic: (councilId, topicId) =>
    axiosInstance.delete(`/api/v1/councils/${councilId}/topics/${topicId}`),

  getMyTopics: (params = {}) =>
    axiosInstance.get('/api/v1/councils/me/topics', { params }),

  // Cập nhật luôn cho fetchAllMyCouncilTopics cho an toàn
  fetchAllMyCouncilTopics: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/councils/me/topics', { 
        params: { page: 0, size: 1000, sort: 'topicId,desc' } 
      });
      return response.data?.content || response.data || [];
    } catch (error) {
      console.error("Lỗi API fetchAllMyCouncilTopics:", error);
      return [];
    }
  },

  getEvaluationStatus: (councilId, topicId) =>
    axiosInstance.get(`/api/v1/councils/${councilId}/evaluations/status`, {
      params: { topicId },
    }),

  startTopicSession: (topicId) =>
    axiosInstance.post(`/api/v1/councils/topics/${topicId}/session/start`),
    
  createCouncilExpert: (data) =>
    axiosInstance.post('/api/v1/users/experts', data),
};