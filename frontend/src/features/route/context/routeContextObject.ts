import { createContext } from 'react';
import type {
  Coordinates,
  Delivery,
  DeliveryAddress,
  FailureReasonCode,
  GeocodingStatus,
  OptimizeRouteSummary,
  RouteSession,
  RouteSummaryInfo,
} from '../types';

type DeliveryInput = Omit<Delivery, 'id' | 'createdAt' | 'status' | 'geocodingStatus'>;

export type ReoptimizeStatus = 'idle' | 'loading' | 'error';

export interface RouteContextValue {
  session: RouteSession;
  /** Devuelve la entrega creada (con su id/status finales) para que quien llama pueda usarla sin esperar el re-render. */
  addDelivery: (input: DeliveryInput) => Delivery;
  removeDelivery: (id: string) => void;
  reorderDeliveries: (deliveries: Delivery[]) => void;
  startDelivery: (id: string) => void;
  completeDelivery: (id: string) => void;
  failDelivery: (id: string, failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => void;
  editDeliveryAddress: (id: string, address: DeliveryAddress) => void;
  updateDeliveryGeocoding: (id: string, coordinates: Coordinates | undefined, geocodingStatus: GeocodingStatus) => void;
  /** Resultado de la última optimización (distancia/tiempo por tramo) — `null` si todavía no se optimizó. */
  routeSummary: RouteSummaryInfo | null;
  setRouteSummary: (
    summary: OptimizeRouteSummary | undefined,
    hasCustomDestination: boolean,
    customDestinationAddress?: DeliveryAddress,
  ) => void;
  /** Estado del recálculo automático en segundo plano (nueva entrega, "Ubicar nuevamente") — para mostrar feedback sin bloquear la UI. */
  reoptimizeStatus: ReoptimizeStatus;
  setReoptimizeStatus: (status: ReoptimizeStatus) => void;
  startNewRoute: () => void;
}

export const RouteContext = createContext<RouteContextValue | null>(null);
