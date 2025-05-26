import { lazy } from 'react';

const LoanRoutes = [
  {
    path: 'loans',
    component: lazy(() => import('views/loan')),
  },
  {
    path: 'loans/list',
    component: lazy(() => import('views/loan')),
  },
  {
    path: 'loans/repayments',
    component: lazy(() => import('views/loan/repayments')),
  },
];

export default LoanRoutes; 