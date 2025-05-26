import request from './request';

const vfdService = {
  getAll: (params) => request.get('dashboard/admin/vfd-receipts', { params }),
  generate: (data) => request.post('dashboard/admin/vfd-receipts/generate', data),
  getById: (id) => request.get(`dashboard/admin/vfd-receipts/${id}`),
  delete: (id) => request.delete(`dashboard/admin/vfd-receipts/${id}`),
};

export default vfdService; 