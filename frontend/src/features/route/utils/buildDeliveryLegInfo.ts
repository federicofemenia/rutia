import type { RouteSummaryInfo } from '../types';

/**
 * Qué mostrar en la card de una entrega sobre el tramo hacia la siguiente parada — ya con los
 * valores de distancia/tiempo que vinieron de OSRM, sin volver a calcular nada acá.
 */
export type DeliveryLegInfo =
  | { kind: 'next'; distance: number; duration: number }
  | { kind: 'destination'; distance: number; duration: number }
  | { kind: 'last' };

/**
 * Agrupa los tramos de `routeSummary.legs` por la entrega de origen (`fromDeliveryId`), para que
 * cada card pueda buscar su propio tramo por id en vez de recorrer el array. El tramo cuyo origen
 * es el punto de partida (`fromDeliveryId: null`, no una entrega) no se asocia a ninguna card.
 */
export function buildDeliveryLegInfo(routeSummary: RouteSummaryInfo | null): Map<string, DeliveryLegInfo> {
  const legInfoByDeliveryId = new Map<string, DeliveryLegInfo>();

  if (!routeSummary) {
    return legInfoByDeliveryId;
  }

  for (const leg of routeSummary.legs) {
    if (!leg.fromDeliveryId) {
      continue;
    }

    if (leg.toDeliveryId) {
      legInfoByDeliveryId.set(leg.fromDeliveryId, { kind: 'next', distance: leg.distance, duration: leg.duration });
      continue;
    }

    // Último tramo del recorrido: sin próxima entrega. Si el chofer configuró un destino final
    // real al optimizar, se muestra la distancia hasta ahí; si no (terminó en su ubicación
    // actual), no hay nada útil que mostrar más allá de que es la última entrega.
    legInfoByDeliveryId.set(
      leg.fromDeliveryId,
      routeSummary.hasCustomDestination ? { kind: 'destination', distance: leg.distance, duration: leg.duration } : { kind: 'last' },
    );
  }

  return legInfoByDeliveryId;
}
