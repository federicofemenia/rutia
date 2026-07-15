import type { Coordinates } from '../../domain/Coordinates.js';
import type { RouteOptimizer, RouteStops } from '../../domain/RouteOptimizer.js';

const OSRM_TRIP_BASE_URL = 'https://router.project-osrm.org/trip/v1/driving';
const REQUEST_TIMEOUT_MS = 15000;

interface OSRMWaypoint {
  waypoint_index: number;
}

interface OSRMTripResponse {
  code: string;
  waypoints: OSRMWaypoint[];
}

export class OSRMRouteOptimizer implements RouteOptimizer {
  async optimize({ start, stops, end }: RouteStops): Promise<number[]> {
    if (stops.length === 0) {
      return [];
    }

    const coordinates: Coordinates[] = [start, ...stops, end];
    const coordinatesParam = coordinates.map((point) => `${point.longitude},${point.latitude}`).join(';');
    const url = new URL(`${OSRM_TRIP_BASE_URL}/${coordinatesParam}`);
    url.searchParams.set('roundtrip', 'false');
    url.searchParams.set('source', 'first');
    url.searchParams.set('destination', 'last');
    url.searchParams.set('overview', 'false');

    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

    if (!response.ok) {
      throw new Error(`OSRM respondió ${response.status} al optimizar la ruta`);
    }

    const data = (await response.json()) as OSRMTripResponse;

    if (data.code !== 'Ok') {
      throw new Error(`OSRM no pudo optimizar la ruta (code: ${data.code})`);
    }

    const stopWaypoints = data.waypoints.slice(1, 1 + stops.length);

    return stopWaypoints
      .map((waypoint, stopIndex) => ({ stopIndex, position: waypoint.waypoint_index }))
      .sort((a, b) => a.position - b.position)
      .map((entry) => entry.stopIndex);
  }
}
