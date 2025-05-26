// ** React Imports
import { lazy } from 'react';

const AIAssistantRoutes = [
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

export default AIAssistantRoutes; 