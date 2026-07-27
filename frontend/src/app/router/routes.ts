export const ROUTES = {
  login: '/login',
  driverRegistration: '/registro-chofer',
  home: '/',
  scan: '/scan',
  routeSummary: '/route-summary',
  map: '/map',
  driverHistory: '/mis-entregas',
  tracking: '/tracking/:driverId',
  trackingMap: '/tracking/:driverId/map',
} as const;

export function buildTrackingPath(driverId: string): string {
  return `/tracking/${encodeURIComponent(driverId)}`;
}

export function buildTrackingMapPath(driverId: string): string {
  return `/tracking/${encodeURIComponent(driverId)}/map`;
}
