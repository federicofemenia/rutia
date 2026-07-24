import type { Coordinates } from '../../domain/Coordinates.js';
import type { RouteLeg, RouteOptimizationResult, RouteOptimizer, RouteStops } from '../../domain/RouteOptimizer.js';

const COMPUTE_ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const REQUEST_TIMEOUT_MS = 15000;

// Se pide únicamente lo que se usa: el FieldMask es el control de costo principal de esta API.
const FIELD_MASK = [
  'routes.optimizedIntermediateWaypointIndex',
  'routes.distanceMeters',
  'routes.duration',
  'routes.polyline.encodedPolyline',
  'routes.legs.distanceMeters',
  'routes.legs.duration',
].join(',');

interface GoogleWaypoint {
  location: { latLng: { latitude: number; longitude: number } };
}

interface GoogleLeg {
  distanceMeters: number;
  duration: string;
}

interface GoogleRoute {
  optimizedIntermediateWaypointIndex?: number[];
  distanceMeters: number;
  duration: string;
  polyline?: { encodedPolyline: string };
  legs: GoogleLeg[];
}

interface ComputeRoutesResponse {
  routes?: GoogleRoute[];
}

interface ComputeRoutesErrorResponse {
  error?: { code: number; message: string; status: string };
}

const EMPTY_RESULT: RouteOptimizationResult = { order: [], totalDistance: 0, totalDuration: 0, legs: [] };

function toWaypoint(point: Coordinates): GoogleWaypoint {
  return { location: { latLng: { latitude: point.latitude, longitude: point.longitude } } };
}

/** Google devuelve la duración como string tipo `"123s"`. */
function parseDurationSeconds(duration: string): number {
  return Number.parseFloat(duration.replace('s', '')) || 0;
}

/**
 * Confirmado contra la API real: con una sola parada intermedia, Google no devuelve `[0]` sino
 * `[-1]` (no hay nada que optimizar, pero el campo igual viene presente con un valor inválido en
 * vez de ausente). Si se usara tal cual, `reorderableDeliveries[-1]` es `undefined` y la entrega
 * desaparece del resultado. Se valida que sea una permutación real de `[0, stopsCount)` antes de
 * confiar en el valor; si no lo es, se usa el orden identidad (para 1 parada, es el único orden
 * posible de todos modos).
 */
function isValidOrder(order: number[], stopsCount: number): boolean {
  if (order.length !== stopsCount) {
    return false;
  }
  const seen = new Set(order);
  return seen.size === stopsCount && order.every((index) => Number.isInteger(index) && index >= 0 && index < stopsCount);
}

export class GoogleRoutesOptimizer implements RouteOptimizer {
  constructor(private readonly apiKey: string) {}

  async optimize({ start, stops, end }: RouteStops): Promise<RouteOptimizationResult> {
    if (stops.length === 0) {
      return EMPTY_RESULT;
    }

    const response = await fetch(COMPUTE_ROUTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        origin: toWaypoint(start),
        destination: toWaypoint(end),
        intermediates: stops.map(toWaypoint),
        travelMode: 'DRIVE',
        optimizeWaypointOrder: true,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as ComputeRoutesErrorResponse | null;
      const status = errorBody?.error?.status ?? response.status;
      throw new Error(`Google Routes respondió ${response.status} al optimizar la ruta (status: ${status})`);
    }

    const data = (await response.json()) as ComputeRoutesResponse;
    const route = data.routes?.[0];

    if (!route) {
      throw new Error('Google Routes no devolvió ninguna ruta');
    }

    const identityOrder = stops.map((_, index) => index);
    const order =
      route.optimizedIntermediateWaypointIndex && isValidOrder(route.optimizedIntermediateWaypointIndex, stops.length)
        ? route.optimizedIntermediateWaypointIndex
        : identityOrder;

    return {
      order,
      totalDistance: route.distanceMeters ?? 0,
      totalDuration: parseDurationSeconds(route.duration ?? '0s'),
      legs: buildLegs(route.legs ?? [], order),
      ...(route.polyline?.encodedPolyline ? { encodedPolyline: route.polyline.encodedPolyline } : {}),
    };
  }
}

/**
 * Google devuelve `legs` en el mismo orden de visita que OSRM (partida -> primera parada -> ... ->
 * destino final), un tramo por segmento consecutivo — misma lógica que ya se usaba para OSRM: se
 * arma [null, ...order] (el `null` inicial es el punto de partida, no una parada) para traducir
 * cada tramo a de qué índice de `stops` viene y a cuál va.
 */
function buildLegs(googleLegs: GoogleLeg[], order: number[]): RouteLeg[] {
  const visitSequence: Array<number | null> = [null, ...order];

  return googleLegs.map((leg, index) => ({
    distance: leg.distanceMeters ?? 0,
    duration: parseDurationSeconds(leg.duration ?? '0s'),
    fromStopIndex: visitSequence[index] ?? null,
    toStopIndex: index + 1 < visitSequence.length ? visitSequence[index + 1] : null,
  }));
}
