import type { Coordinates } from '../../domain/Coordinates.js';
import type { RouteLeg, RouteOptimizationResult, RouteOptimizer, RouteStops } from '../../domain/RouteOptimizer.js';

const OSRM_TRIP_BASE_URL = 'https://router.project-osrm.org/trip/v1/driving';
const REQUEST_TIMEOUT_MS = 15000;

interface OSRMWaypoint {
  waypoint_index: number;
}

interface OSRMLeg {
  distance: number;
  duration: number;
}

interface OSRMTrip {
  distance: number;
  duration: number;
  legs: OSRMLeg[];
}

interface OSRMTripResponse {
  code: string;
  waypoints: OSRMWaypoint[];
  trips: OSRMTrip[];
}

const EMPTY_RESULT: RouteOptimizationResult = { order: [], totalDistance: 0, totalDuration: 0, legs: [] };

export class OSRMRouteOptimizer implements RouteOptimizer {
  async optimize({ start, stops, end }: RouteStops): Promise<RouteOptimizationResult> {
    if (stops.length === 0) {
      return EMPTY_RESULT;
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

    const order = stopWaypoints
      .map((waypoint, stopIndex) => ({ stopIndex, position: waypoint.waypoint_index }))
      .sort((a, b) => a.position - b.position)
      .map((entry) => entry.stopIndex);

    return {
      order,
      totalDistance: data.trips[0]?.distance ?? 0,
      totalDuration: data.trips[0]?.duration ?? 0,
      legs: buildLegs(data.trips[0]?.legs ?? [], order),
    };
  }
}

/**
 * OSRM devuelve `trips[0].legs` en orden de visita (partida -> primera parada -> ... -> destino
 * final), un tramo por cada segmento consecutivo — nunca hace falta pedir nada extra ni volver a
 * calcular distancia/tiempo, ya vienen en la misma respuesta que ya se usaba para el orden.
 * `order` (índices en `stops`) dice qué parada se visita en cada posición; acá se arma la
 * secuencia [null, ...order] (el `null` inicial representa el punto de partida, que no es una
 * parada) para poder decir, de cada tramo, de qué índice de `stops` viene y a cuál va — `null` en
 * los dos extremos (partida y destino final, que tampoco es una parada).
 */
function buildLegs(osrmLegs: OSRMLeg[], order: number[]): RouteLeg[] {
  const visitSequence: Array<number | null> = [null, ...order];

  return osrmLegs.map((leg, index) => ({
    distance: leg.distance,
    duration: leg.duration,
    fromStopIndex: visitSequence[index] ?? null,
    toStopIndex: index + 1 < visitSequence.length ? visitSequence[index + 1] : null,
  }));
}
