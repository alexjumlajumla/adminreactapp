import request from './request';

const loanService = {
  getAll: (params) => request.get('dashboard/admin/loans', { params }),
  getById: (id) => request.get(`dashboard/admin/loans/${id}`),
  create: (data) => request.post('dashboard/admin/loans', data),
  update: (id, data) => request.put(`dashboard/admin/loans/${id}`, data),
  delete: (id) => request.delete(`dashboard/admin/loans/${id}`),
  
  // Repayments
  getRepayments: (params) => request.get('dashboard/admin/loan-repayments', { params }),
  getRepaymentById: (id) => request.get(`dashboard/admin/loan-repayments/${id}`),
  createRepayment: (data) => request.post('dashboard/admin/loan-repayments', data),
  updateRepayment: (id, data) => request.put(`dashboard/admin/loan-repayments/${id}`, data),
  deleteRepayment: (id) => request.delete(`dashboard/admin/loan-repayments/${id}`),
};

export default loanService; 