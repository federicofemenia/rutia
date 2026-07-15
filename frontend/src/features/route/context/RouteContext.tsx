import { useCallback, useMemo, useReducer, type ReactNode } from 'react';
import type { Delivery } from '../types';
import { createRouteSession, routeReducer } from './routeReducer';
import { RouteContext } from './routeContextObject';

type DeliveryInput = Omit<Delivery, 'id' | 'createdAt'>;

interface RouteProviderProps {
  children: ReactNode;
}

export function RouteProvider({ children }: RouteProviderProps) {
  const [session, dispatch] = useReducer(routeReducer, undefined, createRouteSession);

  const addDelivery = useCallback((input: DeliveryInput) => {
    dispatch({
      type: 'ADD_DELIVERY',
      payload: { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    });
  }, []);

  const removeDelivery = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_DELIVERY', payload: { id } });
  }, []);

  const reorderDeliveries = useCallback((deliveries: Delivery[]) => {
    dispatch({ type: 'REORDER_DELIVERIES', payload: deliveries });
  }, []);

  const startNewRoute = useCallback(() => {
    dispatch({ type: 'START_NEW_ROUTE', payload: createRouteSession() });
  }, []);

  const value = useMemo(
    () => ({ session, addDelivery, removeDelivery, reorderDeliveries, startNewRoute }),
    [session, addDelivery, removeDelivery, reorderDeliveries, startNewRoute],
  );

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}
