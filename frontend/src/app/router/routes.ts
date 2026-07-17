export const ROUTES = {
  login: '/login',
  home: '/',
  scan: '/scan',
  routeSummary: '/route-summary',
  map: '/map',
  tracking: '/tracking/:driverName',
} as const;

export function buildTrackingPath(driverName: string): string {
  return `/tracking/${encodeURIComponent(driverName)}`;
}
