import type { Coordinates } from '../../route';

export const MAP_CONFIG = {
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  defaultCenter: { latitude: -34.6037, longitude: -58.3816 } satisfies Coordinates,
  defaultZoom: 12,
  singlePointZoom: 15,
  boundsPadding: [40, 40] as [number, number],
} as const;
