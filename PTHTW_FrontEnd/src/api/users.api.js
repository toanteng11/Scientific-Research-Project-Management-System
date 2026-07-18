import axiosInstance from './axiosInstance';

export const usersApi = {
  // Lấy danh sách người dùng có phân trang
  getAll: (params) => axiosInstance.get('/api/v1/users/', { params }),

  // CẬP NHẬT: Tải toàn bộ danh sách (Dùng cho giao diện chọn chuyên gia)
  fetchAllUsers: async () => {
    const response = await axiosInstance.get('/api/v1/users/', { params: { page: 0, size: 1000, sort: 'fullName,asc' } });
    return response.data?.content || [];
  },

  // BỔ SUNG: API tạo tài khoản chuyên gia (Hội đồng)
  createCouncilExpert: (data) => axiosInstance.post('/api/v1/users/experts', data),

  createManager: (data) =>
    axiosInstance.post('/api/v1/users/managers', data),

  createResearcher: (data) =>
    axiosInstance.post('/api/v1/users/researchers', data),

  createDeptHead: (data) =>
    axiosInstance.post('/api/v1/users/dept-heads', data),

  updateStatus: (id, active) =>
    axiosInstance.patch(`/api/v1/users/${id}/status`, { active }),

  // BỔ SUNG: API chuyên biệt lấy danh sách giảng viên tham gia đề tài (Dành cho Researcher & Dept_Head)
  getEligibleTopicMembers: () => 
    axiosInstance.get('/api/v1/users/eligible-members'),
};