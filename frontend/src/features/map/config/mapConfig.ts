import type { Coordinates } from '../../route';

export const MAP_CONFIG = {
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '',
  defaultCenter: { latitude: -34.6037, longitude: -58.3816 } satisfies Coordinates,
  defaultZoom: 12,
  singlePointZoom: 15,
  boundsPadding: 40,
} as const;
