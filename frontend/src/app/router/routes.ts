export const ROUTES = {
  login: '/login',
  driverRegistration: '/registro-chofer',
  home: '/',
  scan: '/scan',
  routeSummary: '/route-summary',
  map: '/map',
  tracking: '/tracking/:driverId',
} as const;

export function buildTrackingPath(driverId: string): string {
  return `/tracking/${encodeURIComponent(driverId)}`;
}
