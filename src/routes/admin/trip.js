import { lazy } from 'react';

const TripList = lazy(() => import('views/admin-trips'));
const TripDetail = lazy(() => import('views/admin-trips/detail'));
const TripTracking = lazy(() => import('views/admin-trips/map-tracking'));

export default [
  {
    path: 'trips',
    component: TripList,
  },
  {
    path: 'trips/:id',
    component: TripDetail,
  },
  {
    path: 'trips/tracking',
    component: TripTracking,
  },
  {
    path: 'trips/tracking/:id',
    component: TripTracking,
  },
]; 