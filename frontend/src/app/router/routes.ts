export const ROUTES = {
  login: '/login',
  driverRegistration: '/registro-chofer',
  home: '/',
  scan: '/scan',
  routeSummary: '/route-summary',
  map: '/map',
  driverHistory: '/mis-entregas',
  trackingMap: '/tracking/:driverId/map',
  trackingHistory: '/tracking/:driverId/history',
} as const;

export function buildTrackingMapPath(driverId: string): string {
  return `/tracking/${encodeURIComponent(driverId)}/map`;
}

export function buildTrackingHistoryPath(driverId: string): string {
  return `/tracking/${encodeURIComponent(driverId)}/history`;
}
