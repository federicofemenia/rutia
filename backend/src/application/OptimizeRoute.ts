import type { Coordinates } from '../domain/Coordinates.js';
import type { Delivery } from '../domain/Delivery.js';
import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import { GeocodingStatus } from '../domain/GeocodingStatus.js';
import type { RouteOptimizer } from '../domain/RouteOptimizer.js';

export interface OptimizeRouteInput {
  deliveries: Delivery[];
  start: Coordinates;
  end: Coordinates;
}

export interface OptimizeRouteStats {
  verified: number;
  ambiguous: number;
  notFound: number;
  /** Entregas sin resolver por ningún motivo previo (geocoding pendiente heredado de una versión
   *  anterior de la app). Ya no se reintentan automáticamente acá — ver `Geocoder`/
   *  `resolveGeocoding.ts`, que quedan disponibles para un caso futuro de import/administración
   *  que sí necesite geocodificar texto libre server-side. */
  error: number;
}

export interface OptimizeRouteLeg {
  /** Metros. */
  distance: number;
  /** Segundos. */
  duration: number;
  /** `null` cuando el origen del tramo es el punto de partida (no una entrega). */
  fromDeliveryId: string | null;
  /** `null` cuando el destino del tramo es el destino final de la ruta (no una entrega). */
  toDeliveryId: string | null;
}

export interface OptimizeRouteSummary {
  /** Metros, recorrido completo. */
  totalDistance: number;
  /** Segundos, recorrido completo. */
  totalDuration: number;
  /** Un tramo por cada segmento consecutivo del recorrido, en orden de visita. */
  legs: OptimizeRouteLeg[];
  /** Geometría completa del recorrido (polyline codificado), para dibujar la ruta real en el
   *  mapa. Ausente si el proveedor no la devuelve. */
  encodedPolyline?: string;
}

export interface OptimizeRouteResult {
  /** Todas las entregas: las verificadas primero (en el orden optimizado), después las no
   *  resueltas (sin coordinates, conservan su geocodingStatus para que la UI las señale). */
  deliveries: Delivery[];
  stats: OptimizeRouteStats;
  /** Ausente cuando no hubo ninguna entrega verificada para rutear (nada que optimizar). */
  route?: OptimizeRouteSummary;
}

/**
 * Ordena entregas que ya tienen coordenadas resueltas (por Google Places, del lado del cliente) —
 * a diferencia de la versión anterior, no geocodifica nada: bajo el flujo actual una entrega nace
 * `Verified` o no nace, no hay estado `Pending` que reintentar en cada optimización.
 */
export class OptimizeRoute {
  constructor(private readonly routeOptimizer: RouteOptimizer) {}

  async execute({ deliveries, start, end }: OptimizeRouteInput): Promise<OptimizeRouteResult> {
    // Las entregas ya entregadas o fallidas son historial: nunca se vuelven a reordenar, sin
    // importar dónde queden respecto al punto de partida actual — si no las separamos acá, el
    // optimizador las trata como una parada más y puede "moverlas" a cualquier posición (incluida
    // la primera) cuando se reoptimiza con paradas nuevas.
    const finishedDeliveries = deliveries.filter(
      (delivery) => delivery.status === DeliveryStatus.Delivered || delivery.status === DeliveryStatus.Failed,
    );
    const routableDeliveries = deliveries.filter(
      (delivery) => delivery.status !== DeliveryStatus.Delivered && delivery.status !== DeliveryStatus.Failed,
    );

    const verifiedDeliveries = routableDeliveries.filter(
      (delivery): delivery is Delivery & { coordinates: Coordinates } =>
        delivery.geocodingStatus === GeocodingStatus.Verified && delivery.coordinates !== undefined,
    );
    const unresolvedDeliveries = routableDeliveries.filter((delivery) => delivery.geocodingStatus !== GeocodingStatus.Verified);

    const stats: OptimizeRouteStats = {
      verified: verifiedDeliveries.length,
      ambiguous: unresolvedDeliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.Ambiguous).length,
      notFound: unresolvedDeliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.NotFound).length,
      error: unresolvedDeliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.Pending).length,
    };

    if (verifiedDeliveries.length === 0) {
      return { deliveries: [...finishedDeliveries, ...unresolvedDeliveries], stats };
    }

    // La entrega en curso ya está comprometida (el chofer ya la eligió y puede estar en camino):
    // no se reordena, queda como la próxima parada fija. El resto se optimiza a partir de ahí
    // (o del punto de partida dado, si no hay ninguna en curso).
    const inProgressDelivery = verifiedDeliveries.find((delivery) => delivery.status === DeliveryStatus.InProgress);
    const reorderableDeliveries = verifiedDeliveries.filter((delivery) => delivery !== inProgressDelivery);
    const optimizerStart = inProgressDelivery ? inProgressDelivery.coordinates : start;

    const optimization = await this.routeOptimizer.optimize({
      start: optimizerStart,
      stops: reorderableDeliveries.map((delivery) => delivery.coordinates),
      end,
    });

    const orderedReorderableDeliveries = optimization.order.map((index) => reorderableDeliveries[index]);
    const orderedVerifiedDeliveries = inProgressDelivery
      ? [inProgressDelivery, ...orderedReorderableDeliveries]
      : orderedReorderableDeliveries;

    // El optimizador (dominio) no sabe qué es una `Delivery`, solo trabaja con índices de
    // `stops` — acá, que sí conoce `reorderableDeliveries`, se traduce cada tramo a ids de
    // entrega. El origen del primer tramo es la entrega en curso si la hay (`optimizerStart`
    // viene de ahí), o `null` si se partió desde la ubicación del chofer sin ninguna entrega en
    // curso.
    const deliveryIdForStopIndex = (stopIndex: number | null): string | null =>
      stopIndex === null ? null : reorderableDeliveries[stopIndex].id;

    const route: OptimizeRouteSummary = {
      totalDistance: optimization.totalDistance,
      totalDuration: optimization.totalDuration,
      legs: optimization.legs.map((leg) => ({
        distance: leg.distance,
        duration: leg.duration,
        fromDeliveryId: leg.fromStopIndex === null ? (inProgressDelivery?.id ?? null) : deliveryIdForStopIndex(leg.fromStopIndex),
        toDeliveryId: deliveryIdForStopIndex(leg.toStopIndex),
      })),
      ...(optimization.encodedPolyline ? { encodedPolyline: optimization.encodedPolyline } : {}),
    };

    return { deliveries: [...finishedDeliveries, ...orderedVerifiedDeliveries, ...unresolvedDeliveries], stats, route };
  }
}
