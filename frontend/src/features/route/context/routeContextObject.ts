import { createContext } from 'react';
import type { Delivery, FailureReasonCode, RouteSession } from '../types';

type DeliveryInput = Omit<Delivery, 'id' | 'createdAt' | 'status'>;

export interface RouteContextValue {
  session: RouteSession;
  addDelivery: (input: DeliveryInput) => void;
  removeDelivery: (id: string) => void;
  reorderDeliveries: (deliveries: Delivery[]) => void;
  startDelivery: (id: string) => void;
  completeDelivery: (id: string) => void;
  failDelivery: (id: string, failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => void;
  startNewRoute: () => void;
}

export const RouteContext = createContext<RouteContextValue | null>(null);
