// ** React Imports
import { lazy } from 'react';

const AppRoutes = [
  {
    path: 'dashboard',
    component: lazy(() => import('views/dashboard')),
  },
  {
    path: 'payouts',
    component: lazy(() => import('views/admin-payouts')),
  },
  {
    path: 'catalog/menu/categories',
    component: lazy(() => import('views/menu-categories')),
  },
  {
    path: 'settings/bookingUpload',
    component: lazy(() => import('views/booking-file-upload')),
  },
  {
    path: 'pos-system',
    component: lazy(() => import('views/pos-system')),
  },
  {
    path: 'cashback',
    component: lazy(() => import('views/cashback')),
  },
  {
    path: 'stories',
    component: lazy(() => import('views/story')),
  },
  {
    path: 'email/subscriber',
    component: lazy(() => import('views/email-subscribers')),
  },
  {
    path: 'subscriber',
    component: lazy(() => import('views/subscriber')),
  },
  {
    path: 'chat',
    component: lazy(() => import('views/chat')),
  },
  {
    path: 'transactions',
    component: lazy(() => import('views/transactions')),
  },
  {
    path: 'payout-requests',
    component: lazy(() => import('views/payout-requests')),
  },
  {
    path: 'catalog',
    component: lazy(() => import('views/catalog')),
  },
  {
    path: 'bonus/list',
    component: lazy(() => import('views/bonus')),
  },
  {
    path: 'ai-assistant/dashboard',
    component: lazy(() => import('views/ai-assistant/dashboard')),
  },
  {
    path: 'ai-assistant/logs',
    component: lazy(() => import('views/ai-assistant/logs')),
  },
  {
    path: 'ai-assistant/product-metadata',
    component: lazy(() => import('views/ai-assistant/product-metadata')),
  },
  {
    path: 'ai-assistant/user-credits',
    component: lazy(() => import('views/ai-assistant/user-credits')),
  },
];

export default AppRoutes;
