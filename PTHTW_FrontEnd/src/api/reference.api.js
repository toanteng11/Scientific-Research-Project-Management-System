import axiosInstance from './axiosInstance';

export const referenceApi = {
  getEnums: () =>
    axiosInstance.get('/api/v1/reference/enums'),
};
