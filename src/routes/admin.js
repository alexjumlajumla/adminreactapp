import React from 'react';

const AdminRoutes = [
  // AI Assistant routes
  {
    path: '/admin/ai-assistant',
    component: React.lazy(() => import('../views/ai-assistant/dashboard')),
    layout: 'admin',
    exact: true,
  },
  {
    path: '/admin/ai-assistant/logs',
    component: React.lazy(() => import('../views/ai-assistant/logs')),
    layout: 'admin',
    exact: true,
  },
  {
    path: '/admin/ai-assistant/user-credits',
    component: React.lazy(() => import('../views/ai-assistant/user-credits')),
    layout: 'admin',
    exact: true,
  },
  {
    path: '/admin/ai-assistant/product-metadata',
    component: React.lazy(() => import('../views/ai-assistant/product-metadata')),
    layout: 'admin',
    exact: true,
  }
];

export default AdminRoutes; 