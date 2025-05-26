import request from './request';

const loanSellerService = {
  // Loans
  getAll: (params) => request.get('dashboard/seller/loans', { params }),
  getById: (id) => request.get(`dashboard/seller/loans/${id}`),

  // Repayments
  getRepayments: (params) => request.get('dashboard/seller/loan-repayments', { params }),
  createRepayment: (data) => request.post('dashboard/seller/loan-repayments', data),

  getStatistics: (params) =>
    request
      .get('dashboard/seller/loan-analytics/statistics', { params })
      .then((res) => res.data),
};

export default loanSellerService; 