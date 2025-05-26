import { lazy } from 'react';

export const vfdRoutes = [
  {
    path: 'vfd-receipts',
    element: lazy(() => import('views/vfd')),
  },
]; 