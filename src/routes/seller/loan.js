import { lazy } from 'react';

const SellerLoanRoutes = [
  {
    path: 'seller/loans',
    component: lazy(() => import('views/seller-views/loan')), // list & analytics
  },
  {
    path: 'seller/loans/list',
    component: lazy(() => import('views/seller-views/loan')), // alias
  },
  {
    path: 'seller/loans/repayments',
    component: lazy(() => import('views/seller-views/loan/repayments')), // repayments list
  },
];

export default SellerLoanRoutes; 