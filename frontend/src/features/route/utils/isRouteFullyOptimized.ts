import { DeliveryStatus, GeocodingStatus, type Delivery, type RouteSummaryInfo } from '../types';
import type { DeliveryLegInfo } from './buildDeliveryLegInfo';

/**
 * true si todas las entregas ruteables (no entregadas/falladas, con ubicación verificada) ya
 * están reflejadas en el último resultado de optimización — es decir, ninguna se agregó ni editó
 * después de la última vez que se tocó "Optimizar ruta". `legInfoByDeliveryId` ya viene calculado
 * (`buildDeliveryLegInfo`) y cada entrega que participó de esa optimización aparece ahí como
 * origen de exactamente un tramo, así que alcanza con chequear membership en vez de recorrer
 * `routeSummary.legs` de nuevo.
 */
export function isRouteFullyOptimized(
  deliveries: Delivery[],
  legInfoByDeliveryId: Map<string, DeliveryLegInfo>,
  routeSummary: RouteSummaryInfo | null,
): boolean {
  if (!routeSummary) {
    return false;
  }

  const routableDeliveries = deliveries.filter(
    (delivery) =>
      delivery.status !== DeliveryStatus.Delivered &&
      delivery.status !== DeliveryStatus.Failed &&
      delivery.geocodingStatus === GeocodingStatus.Verified,
  );

  if (routableDeliveries.length === 0) {
    return true;
  }

  return routableDeliveries.every((delivery) => legInfoByDeliveryId.has(delivery.id));
}
