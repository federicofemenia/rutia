import { useCallback } from 'react';
import { useCurrentLocation } from '../../geolocation';
import { type CustomDestination, type Delivery, type RouteSummaryInfo, useOptimizeRoute, useRoute } from '../../route';

/**
 * Si el chofer borra una entrega de una ruta que YA estaba optimizada, la vuelve a optimizar en
 * silencio (mismo destino que la vez anterior, ubicación actual fresca como origen) en vez de
 * dejar el resumen mostrando una distancia/tiempo que ya no es real. A diferencia del flujo manual
 * ("Optimizar ruta"), no le vuelve a preguntar al chofer dónde termina — reusa lo que ya había
 * elegido. Si no había una optimización previa, o no se puede conseguir ubicación (permiso
 * denegado, sin señal), no hace nada: el aviso "Optimizá de nuevo" que ya existe cubre ese caso.
 */
export function useReoptimizeAfterDelete() {
  const { requestLocation } = useCurrentLocation();
  const { optimize } = useOptimizeRoute();
  const { reorderDeliveries, setRouteSummary } = useRoute();

  return useCallback(
    async (remainingDeliveries: Delivery[], previousSummary: RouteSummaryInfo | null) => {
      if (!previousSummary) {
        return;
      }

      const previousDestination: CustomDestination | undefined = previousSummary.hasCustomDestination
        ? previousSummary.customDestination
        : undefined;

      const start = await requestLocation();
      if (!start) {
        return;
      }

      const end = previousDestination ? previousDestination.coordinates : start;
      const result = await optimize({ deliveries: remainingDeliveries, start, end });

      if (result) {
        reorderDeliveries(result.deliveries);
        setRouteSummary(result.route, Boolean(previousDestination), previousDestination);
      }
    },
    [requestLocation, optimize, reorderDeliveries, setRouteSummary],
  );
}
