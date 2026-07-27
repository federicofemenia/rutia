import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { useAuth } from '../../auth';
import { fetchRouteSession, finishRouteSession, pushRouteSession } from '../../route-sync';
import {
  DeliveryStatus,
  GeocodingStatus,
  type Coordinates,
  type CustomDestination,
  type Delivery,
  type DeliveryAddress,
  type FailureReasonCode,
  type OptimizeRouteSummary,
  type RouteSession,
  type RouteSummaryInfo,
} from '../types';
import { loadRouteSessionForUser } from '../utils/loadRouteSessionForUser';
import { RouteContext } from './routeContextObject';
import { createRouteSession, routeReducer } from './routeReducer';

type DeliveryInput = Omit<Delivery, 'id' | 'createdAt' | 'status' | 'geocodingStatus'>;

interface RouteProviderProps {
  children: ReactNode;
}

export function RouteProvider({ children }: RouteProviderProps) {
  const { user } = useAuth();
  const [session, dispatch] = useReducer(routeReducer, undefined, createRouteSession);
  const [isHydrated, setIsHydrated] = useState(false);
  // Ephemeral, no se persiste (ni localStorage ni backend): es el resultado de la última vez que
  // el chofer tocó "Optimizar ruta" — no es parte del dominio de la sesión (`RouteSession`/
  // `Delivery` no cambian), solo datos para mostrar. No se recalcula solo: agregar, editar o
  // borrar una entrega no lo toca, el chofer decide cuándo volver a optimizar.
  const [routeSummary, setRouteSummaryState] = useState<RouteSummaryInfo | null>(null);

  // La base de datos (vía el backend, scopeado por el usuario autenticado) es la única fuente de
  // verdad de la RouteSession — nunca localStorage. Al cambiar de usuario (id distinto), se
  // limpia el estado en memoria de inmediato, ANTES de pedir la sesión nueva, para que nunca se
  // llegue a mostrar la ruta de la cuenta anterior mientras se espera la respuesta del backend.
  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    setIsHydrated(false);
    dispatch({ type: 'START_NEW_ROUTE', payload: createRouteSession() });
    setRouteSummaryState(null);

    loadRouteSessionForUser({ fetchRouteSession }).then((loaded) => {
      if (cancelled) {
        return;
      }
      dispatch({ type: 'RESTORE_SESSION', payload: loaded });
      setIsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
    // Deliberadamente `user?.id`, no `user`: solo debe re-hidratar cuando cambia la identidad del
    // usuario, no cada vez que el objeto `user` cambie de referencia por otro motivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    pushRouteSession(session).catch((error) => {
      console.error('No se pudo sincronizar la ruta con el servidor', error);
    });
  }, [session, isHydrated]);

  const addDelivery = useCallback((input: DeliveryInput): Delivery => {
    const delivery: Delivery = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: DeliveryStatus.Pending,
      // Places ya resolvió la dirección a coordenadas antes de llegar acá — nace `Verified`
      // directamente, sin pasar por un estado intermedio a geocodificar.
      geocodingStatus: input.coordinates ? GeocodingStatus.Verified : GeocodingStatus.Pending,
    };
    dispatch({ type: 'ADD_DELIVERY', payload: delivery });
    return delivery;
  }, []);

  const removeDelivery = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_DELIVERY', payload: { id } });
    // El resumen de la última optimización puede incluir tramos hacia/desde la entrega borrada —
    // dejarlo como estaba mostraría una distancia/tiempo total que ya no es real. Se limpia en vez
    // de recalcularlo solo: el chofer sigue decidiendo cuándo optimizar, con el aviso ya existente.
    setRouteSummaryState(null);
  }, []);

  const reorderDeliveries = useCallback((deliveries: Delivery[]) => {
    dispatch({ type: 'REORDER_DELIVERIES', payload: deliveries });
  }, []);

  const startDelivery = useCallback((id: string) => {
    dispatch({ type: 'START_DELIVERY', payload: { id } });
  }, []);

  const undoStartDelivery = useCallback((id: string) => {
    dispatch({ type: 'UNDO_START_DELIVERY', payload: { id } });
  }, []);

  const completeDelivery = useCallback((id: string) => {
    dispatch({ type: 'COMPLETE_DELIVERY', payload: { id } });
  }, []);

  const failDelivery = useCallback(
    (id: string, failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => {
      dispatch({ type: 'FAIL_DELIVERY', payload: { id, failureReasonCode, failureReasonDetail } });
    },
    [],
  );

  const editDeliveryAddress = useCallback((id: string, address: DeliveryAddress, coordinates: Coordinates) => {
    dispatch({ type: 'UPDATE_DELIVERY_ADDRESS', payload: { id, address, coordinates } });
  }, []);

  const setRouteSummary = useCallback(
    (summary: OptimizeRouteSummary | undefined, hasCustomDestination: boolean, customDestination?: CustomDestination) => {
      setRouteSummaryState(summary ? { ...summary, hasCustomDestination, customDestination } : null);
    },
    [],
  );

  const startNewRoute = useCallback(() => {
    dispatch({ type: 'START_NEW_ROUTE', payload: createRouteSession() });
    setRouteSummaryState(null);
  }, []);

  // El backend revalida server-side que no queden entregas sin resolver — si rechaza, se propaga
  // el error tal cual para que la pantalla lo muestre (nunca se asume éxito de forma optimista).
  const finishRoute = useCallback(async (): Promise<RouteSession> => {
    const finished = await finishRouteSession();
    dispatch({ type: 'RESTORE_SESSION', payload: finished });
    return finished;
  }, []);

  const value = useMemo(
    () => ({
      session,
      addDelivery,
      removeDelivery,
      reorderDeliveries,
      startDelivery,
      undoStartDelivery,
      completeDelivery,
      failDelivery,
      editDeliveryAddress,
      routeSummary,
      setRouteSummary,
      startNewRoute,
      finishRoute,
    }),
    [
      session,
      addDelivery,
      removeDelivery,
      reorderDeliveries,
      startDelivery,
      undoStartDelivery,
      completeDelivery,
      failDelivery,
      editDeliveryAddress,
      routeSummary,
      setRouteSummary,
      startNewRoute,
      finishRoute,
    ],
  );

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}
