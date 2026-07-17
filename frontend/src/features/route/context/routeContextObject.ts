import { createContext } from 'react';
import type { Delivery, DeliveryAddress, FailureReasonCode, RouteSession } from '../types';

type DeliveryInput = Omit<Delivery, 'id' | 'createdAt' | 'status' | 'geocodingStatus'>;

export interface RouteContextValue {
  session: RouteSession;
  addDelivery: (input: DeliveryInput) => void;
  removeDelivery: (id: string) => void;
  reorderDeliveries: (deliveries: Delivery[]) => void;
  startDelivery: (id: string) => void;
  completeDelivery: (id: string) => void;
  failDelivery: (id: string, failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => void;
  editDeliveryAddress: (id: string, address: DeliveryAddress) => void;
  startNewRoute: () => void;
}

export const RouteContext = createContext<RouteContextValue | null>(null);
