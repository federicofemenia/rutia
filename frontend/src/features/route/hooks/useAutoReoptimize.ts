import { useCallback } from 'react';
import { useCurrentLocation } from '../../geolocation';
import type { Delivery } from '../types';
import { useOptimizeRoute } from './useOptimizeRoute';
import { useRoute } from './useRoute';

interface UseAutoReoptimizeResult {
  /** Recalcula la ruta completa en segundo plano, sin diálogo ni preguntas — reusa el destino
   *  (ubicación actual o dirección fija) elegido la última vez que se optimizó explícitamente, y
   *  pide una ubicación actual fresca para el punto de partida. No hace nada si todavía no se
   *  optimizó nunca (no hay destino que reusar). */
  triggerAutoReoptimize: (deliveries: Delivery[]) => Promise<void>;
}

/**
 * Cubre los casos donde algo cambió después de la primera optimización explícita (nueva entrega
 * agregada, una entrega ambigua resuelta con "Ubicar nuevamente") y hace falta recalcular
 * distancias/tiempos/orden sin volver a interrumpir al chofer con el diálogo de "¿tu ubicación
 * actual o una dirección fija?" — esa pregunta ya se respondió una vez, se reusa la respuesta.
 */
export function useAutoReoptimize(): UseAutoReoptimizeResult {
  const { routeSummary, reorderDeliveries, setRouteSummary, setReoptimizeStatus } = useRoute();
  const { requestLocation } = useCurrentLocation();
  const { optimize } = useOptimizeRoute();

  const triggerAutoReoptimize = useCallback(
    async (deliveries: Delivery[]) => {
      if (!routeSummary) {
        return;
      }

      setReoptimizeStatus('loading');

      const start = await requestLocation();
      if (!start) {
        setReoptimizeStatus('error');
        return;
      }

      const end =
        routeSummary.hasCustomDestination && routeSummary.customDestinationAddress
          ? { address: routeSummary.customDestinationAddress }
          : start;

      const result = await optimize({ deliveries, start, end });
      if (!result) {
        setReoptimizeStatus('error');
        return;
      }

      reorderDeliveries(result.deliveries);
      setRouteSummary(result.route, routeSummary.hasCustomDestination, routeSummary.customDestinationAddress);
      setReoptimizeStatus('idle');
    },
    [routeSummary, requestLocation, optimize, reorderDeliveries, setRouteSummary, setReoptimizeStatus],
  );

  return { triggerAutoReoptimize };
}
