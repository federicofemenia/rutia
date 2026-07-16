import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { usePersistence } from '../../persistence';
import { RestoreSessionDialog } from '../components/RestoreSessionDialog';
import { DeliveryStatus, type Delivery, type FailureReasonCode, type RouteSession } from '../types';
import { RouteContext } from './routeContextObject';
import { createRouteSession, routeReducer } from './routeReducer';

type DeliveryInput = Omit<Delivery, 'id' | 'createdAt' | 'status'>;
type InitPhase = 'checking' | 'awaitingChoice' | 'ready';

interface RouteProviderProps {
  children: ReactNode;
}

export function RouteProvider({ children }: RouteProviderProps) {
  const [session, dispatch] = useReducer(routeReducer, undefined, createRouteSession);
  const { saveRoute, loadRoute, clearRoute } = usePersistence();

  const [phase, setPhase] = useState<InitPhase>('checking');
  const [restorableSession, setRestorableSession] = useState<RouteSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadRoute().then((persisted) => {
      if (cancelled) {
        return;
      }

      if (persisted && persisted.deliveries.length > 0) {
        setRestorableSession(persisted);
        setPhase('awaitingChoice');
      } else {
        setPhase('ready');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadRoute]);

  useEffect(() => {
    if (phase === 'ready') {
      saveRoute(session);
    }
  }, [session, phase, saveRoute]);

  const addDelivery = useCallback((input: DeliveryInput) => {
    dispatch({
      type: 'ADD_DELIVERY',
      payload: {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: DeliveryStatus.Pending,
      },
    });
  }, []);

  const removeDelivery = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_DELIVERY', payload: { id } });
  }, []);

  const reorderDeliveries = useCallback((deliveries: Delivery[]) => {
    dispatch({ type: 'REORDER_DELIVERIES', payload: deliveries });
  }, []);

  const startDelivery = useCallback((id: string) => {
    dispatch({ type: 'START_DELIVERY', payload: { id } });
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

  const startNewRoute = useCallback(() => {
    dispatch({ type: 'START_NEW_ROUTE', payload: createRouteSession() });
  }, []);

  const handleContinue = useCallback(() => {
    if (restorableSession) {
      dispatch({ type: 'RESTORE_SESSION', payload: restorableSession });
    }
    setRestorableSession(null);
    setPhase('ready');
  }, [restorableSession]);

  const handleStartNew = useCallback(() => {
    clearRoute();
    setRestorableSession(null);
    setPhase('ready');
  }, [clearRoute]);

  const value = useMemo(
    () => ({
      session,
      addDelivery,
      removeDelivery,
      reorderDeliveries,
      startDelivery,
      completeDelivery,
      failDelivery,
      startNewRoute,
    }),
    [session, addDelivery, removeDelivery, reorderDeliveries, startDelivery, completeDelivery, failDelivery, startNewRoute],
  );

  return (
    <RouteContext.Provider value={value}>
      {children}
      <RestoreSessionDialog
        open={phase === 'awaitingChoice'}
        deliveryCount={restorableSession?.deliveries.length ?? 0}
        lastModified={restorableSession?.updatedAt ?? new Date()}
        onContinue={handleContinue}
        onStartNew={handleStartNew}
      />
    </RouteContext.Provider>
  );
}
