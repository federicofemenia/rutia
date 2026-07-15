import { createContext } from 'react';
import type { Delivery, RouteSession } from '../types';

type DeliveryInput = Omit<Delivery, 'id' | 'createdAt'>;

export interface RouteContextValue {
  session: RouteSession;
  addDelivery: (input: DeliveryInput) => void;
  removeDelivery: (id: string) => void;
  reorderDeliveries: (deliveries: Delivery[]) => void;
  startNewRoute: () => void;
}

export const RouteContext = createContext<RouteContextValue | null>(null);
