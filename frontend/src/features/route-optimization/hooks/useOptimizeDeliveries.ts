import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/router/routes';
import { type Delivery, type DeliveryAddress, type OptimizeRouteSummary, useRoute } from '../../route';

interface UseOptimizeDeliveriesResult {
  isDialogOpen: boolean;
  openOptimizeDialog: () => void;
  closeOptimizeDialog: () => void;
  /** Pasar directo como `onOptimized` de `OptimizeRouteDialog`. */
  handleOptimized: (
    deliveries: Delivery[],
    route: OptimizeRouteSummary | undefined,
    hasCustomDestination: boolean,
    customDestinationAddress?: DeliveryAddress,
  ) => void;
}

/**
 * Controla la primera optimización explícita de la ruta (la única vez que se le pregunta al
 * chofer por su destino) — guarda el resultado y el destino elegido, y navega a la lista. Los
 * recálculos posteriores (nueva entrega, "Ubicar nuevamente") ya no pasan por acá, ver
 * `useAutoReoptimize`.
 */
export function useOptimizeDeliveries(): UseOptimizeDeliveriesResult {
  const navigate = useNavigate();
  const { reorderDeliveries, setRouteSummary } = useRoute();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openOptimizeDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeOptimizeDialog = useCallback(() => setIsDialogOpen(false), []);

  const handleOptimized = useCallback(
    (
      deliveries: Delivery[],
      route: OptimizeRouteSummary | undefined,
      hasCustomDestination: boolean,
      customDestinationAddress?: DeliveryAddress,
    ) => {
      reorderDeliveries(deliveries);
      setRouteSummary(route, hasCustomDestination, customDestinationAddress);
      navigate(ROUTES.routeSummary);
    },
    [reorderDeliveries, setRouteSummary, navigate],
  );

  return { isDialogOpen, openOptimizeDialog, closeOptimizeDialog, handleOptimized };
}
