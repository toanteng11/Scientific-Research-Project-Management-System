import axiosInstance from './axiosInstance';
import { fetchAllSpringPageContents } from '../utils/pagination';

export const departmentsApi = {
  getAll: (params = {}) =>
    axiosInstance.get('/api/v1/departments/', {
      params: { sort: 'departmentName,asc', ...params },
    }),

  /** Loads every department page (bounded page size per request) for dropdowns. */
  fetchAllDepartments: (extra = {}) =>
    fetchAllSpringPageContents((p) =>
      axiosInstance.get('/api/v1/departments/', {
        params: { sort: 'departmentName,asc', ...p, ...extra },
      }),
    ),

  getMyTopics: (params = {}) =>
    axiosInstance.get('/api/v1/departments/me/topics', { params }),
};
