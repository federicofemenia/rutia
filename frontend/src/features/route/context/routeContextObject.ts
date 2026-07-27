import { createContext } from 'react';
import type {
  Coordinates,
  CustomDestination,
  Delivery,
  DeliveryAddress,
  FailureReasonCode,
  OptimizeRouteSummary,
  RouteSession,
  RouteSummaryInfo,
} from '../types';

type DeliveryInput = Omit<Delivery, 'id' | 'createdAt' | 'status' | 'geocodingStatus'>;

export interface RouteContextValue {
  session: RouteSession;
  /** Devuelve la entrega creada (con su id/status finales) para que quien llama pueda usarla sin esperar el re-render. */
  addDelivery: (input: DeliveryInput) => Delivery;
  removeDelivery: (id: string) => void;
  reorderDeliveries: (deliveries: Delivery[]) => void;
  startDelivery: (id: string) => void;
  /** Deshace "Iniciar reparto": vuelve la entrega de InProgress a Pending. */
  undoStartDelivery: (id: string) => void;
  completeDelivery: (id: string) => void;
  failDelivery: (id: string, failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => void;
  editDeliveryAddress: (id: string, address: DeliveryAddress, coordinates: Coordinates) => void;
  /** Resultado de la última optimización (distancia/tiempo por tramo) — `null` si todavía no se optimizó. */
  routeSummary: RouteSummaryInfo | null;
  setRouteSummary: (
    summary: OptimizeRouteSummary | undefined,
    hasCustomDestination: boolean,
    customDestination?: CustomDestination,
  ) => void;
  startNewRoute: () => void;
}

export const RouteContext = createContext<RouteContextValue | null>(null);
