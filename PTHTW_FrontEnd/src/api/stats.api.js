import axiosInstance from './axiosInstance';

export const statsApi = {
  getSummary: () =>
    axiosInstance.get('/api/v1/stats/summary'),
};
