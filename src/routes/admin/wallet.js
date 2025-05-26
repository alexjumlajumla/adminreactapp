import { lazy } from 'react';

const WalletRoutes = [
  {
    path: 'wallet-histories',
    component: lazy(() => import('views/wallet')),
  },
];

export default WalletRoutes; 