import { lazy } from 'react';

export const loanRoutes = [
  {
    path: 'loans/list',
    element: lazy(() => import('views/loans/list')),
  },
  {
    path: 'loans/repayments',
    element: lazy(() => import('views/loans/repayments')),
  },
]; 