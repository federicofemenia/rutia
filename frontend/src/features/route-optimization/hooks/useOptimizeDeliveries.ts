import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/router/routes';
import { type CustomDestination, type Delivery, type OptimizeRouteSummary, useRoute } from '../../route';

interface UseOptimizeDeliveriesResult {
  isDialogOpen: boolean;
  openOptimizeDialog: () => void;
  closeOptimizeDialog: () => void;
  /** Pasar directo como `onOptimized` de `OptimizeRouteDialog`. */
  handleOptimized: (
    deliveries: Delivery[],
    route: OptimizeRouteSummary | undefined,
    hasCustomDestination: boolean,
    customDestination?: CustomDestination,
  ) => void;
}

/**
 * Controla el diálogo de optimización — se le pregunta al chofer su destino cada vez, sin
 * recordar la respuesta anterior. Se usa tanto para la primera optimización (botón "Optimizar
 * ruta" en Mi ruta, con la lista todavía en orden de carga) como para cualquier re-optimización
 * posterior: no hay recálculo automático en segundo plano, agregar/editar/borrar una entrega no
 * dispara nada solo, el chofer decide cuándo optimizar tocando el botón de nuevo.
 */
export function useOptimizeDeliveries(): UseOptimizeDeliveriesResult {
  const navigate = useNavigate();
  const { reorderDeliveries, setRouteSummary } = useRoute();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openOptimizeDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeOptimizeDialog = useCallback(() => setIsDialogOpen(false), []);

  const handleOptimized = useCallback(
    (deliveries: Delivery[], route: OptimizeRouteSummary | undefined, hasCustomDestination: boolean, customDestination?: CustomDestination) => {
      reorderDeliveries(deliveries);
      setRouteSummary(route, hasCustomDestination, customDestination);
      navigate(ROUTES.routeSummary);
    },
    [reorderDeliveries, setRouteSummary, navigate],
  );

  return { isDialogOpen, openOptimizeDialog, closeOptimizeDialog, handleOptimized };
}
