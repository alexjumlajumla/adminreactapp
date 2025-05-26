import { lazy } from 'react';

const BroadcastSend  = lazy(() => import('views/admin-broadcast'));
const BroadcastList  = lazy(() => import('views/admin-broadcast/list'));

export default [
  {
    path: 'broadcast/send',
    component: BroadcastSend,
  },
  {
    path: 'broadcast',
    component: BroadcastList,
  },
]; 