import {
  DeliveryStatus,
  GeocodingStatus,
  RouteSessionStatus,
  type Coordinates,
  type Delivery,
  type DeliveryAddress,
  type FailureReasonCode,
  type RouteSession,
} from '../types';

export type RouteAction =
  | { type: 'ADD_DELIVERY'; payload: Delivery }
  | { type: 'REMOVE_DELIVERY'; payload: { id: string } }
  | { type: 'REORDER_DELIVERIES'; payload: Delivery[] }
  | { type: 'START_DELIVERY'; payload: { id: string } }
  | { type: 'UNDO_START_DELIVERY'; payload: { id: string } }
  | { type: 'COMPLETE_DELIVERY'; payload: { id: string } }
  | { type: 'FAIL_DELIVERY'; payload: { id: string; failureReasonCode: FailureReasonCode; failureReasonDetail?: string } }
  | { type: 'UPDATE_DELIVERY_ADDRESS'; payload: { id: string; address: DeliveryAddress; coordinates: Coordinates } }
  | { type: 'RESTORE_SESSION'; payload: RouteSession }
  | { type: 'START_NEW_ROUTE'; payload: RouteSession };

export function createRouteSession(): RouteSession {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    deliveries: [],
    status: RouteSessionStatus.InProgress,
  };
}

function updateDelivery(deliveries: Delivery[], id: string, update: Partial<Delivery>): Delivery[] {
  return deliveries.map((delivery) => (delivery.id === id ? { ...delivery, ...update } : delivery));
}

export function routeReducer(state: RouteSession, action: RouteAction): RouteSession {
  switch (action.type) {
    case 'ADD_DELIVERY':
      return {
        ...state,
        deliveries: [...state.deliveries, action.payload],
        // Si se agrega una entrega a una ruta ya finalizada (ej. "+" en Mi ruta después de
        // "Terminar recorrido"), deja de estar finalizada — evidentemente el chofer siguió
        // trabajando en ella. La foto ya archivada en el histórico no se toca.
        status: RouteSessionStatus.InProgress,
        updatedAt: new Date(),
      };

    case 'REMOVE_DELIVERY':
      return {
        ...state,
        deliveries: state.deliveries.filter((delivery) => delivery.id !== action.payload.id),
        updatedAt: new Date(),
      };

    case 'REORDER_DELIVERIES':
      return { ...state, deliveries: action.payload, updatedAt: new Date() };

    case 'START_DELIVERY': {
      const target = state.deliveries.find((delivery) => delivery.id === action.payload.id);
      const hasActiveDelivery = state.deliveries.some((delivery) => delivery.status === DeliveryStatus.InProgress);

      if (!target || target.status !== DeliveryStatus.Pending || hasActiveDelivery) {
        return state;
      }

      return {
        ...state,
        deliveries: updateDelivery(state.deliveries, action.payload.id, { status: DeliveryStatus.InProgress }),
        updatedAt: new Date(),
      };
    }

    // UNDO_START_DELIVERY, COMPLETE_DELIVERY y FAIL_DELIVERY se permiten desde cualquier estado ya
    // arrancado (InProgress/Delivered/Failed), no solo InProgress — así el chofer puede corregir
    // un toque equivocado (ej. marcó "entregada" y quería "fallida") sin quedar trabado. Nunca
    // desde Pending: hay que iniciar el reparto primero. Cada transición limpia los campos del
    // estado que deja atrás (deliveredAt/failureReason) para no dejar datos de un estado viejo.
    case 'UNDO_START_DELIVERY': {
      const target = state.deliveries.find((delivery) => delivery.id === action.payload.id);

      if (!target || target.status === DeliveryStatus.Pending) {
        return state;
      }

      return {
        ...state,
        deliveries: updateDelivery(state.deliveries, action.payload.id, {
          status: DeliveryStatus.Pending,
          deliveredAt: undefined,
          failureReasonCode: undefined,
          failureReasonDetail: undefined,
        }),
        updatedAt: new Date(),
      };
    }

    case 'COMPLETE_DELIVERY': {
      const target = state.deliveries.find((delivery) => delivery.id === action.payload.id);

      if (!target || target.status === DeliveryStatus.Pending) {
        return state;
      }

      return {
        ...state,
        deliveries: updateDelivery(state.deliveries, action.payload.id, {
          status: DeliveryStatus.Delivered,
          deliveredAt: new Date().toISOString(),
          failureReasonCode: undefined,
          failureReasonDetail: undefined,
        }),
        updatedAt: new Date(),
      };
    }

    case 'FAIL_DELIVERY': {
      const target = state.deliveries.find((delivery) => delivery.id === action.payload.id);

      if (!target || target.status === DeliveryStatus.Pending) {
        return state;
      }

      return {
        ...state,
        deliveries: updateDelivery(state.deliveries, action.payload.id, {
          status: DeliveryStatus.Failed,
          failureReasonCode: action.payload.failureReasonCode,
          failureReasonDetail: action.payload.failureReasonDetail,
          deliveredAt: undefined,
        }),
        updatedAt: new Date(),
      };
    }

    case 'UPDATE_DELIVERY_ADDRESS': {
      const target = state.deliveries.find((delivery) => delivery.id === action.payload.id);

      if (!target) {
        return state;
      }

      // La nueva dirección siempre viene de una selección de Places ya resuelta a coordenadas
      // (ver `PlacesAutocompleteInput`) — a diferencia del formulario manual que reemplaza, nunca
      // hay un estado intermedio "dirección editada, coordenadas por confirmar".
      return {
        ...state,
        deliveries: updateDelivery(state.deliveries, action.payload.id, {
          address: action.payload.address,
          coordinates: action.payload.coordinates,
          geocodingStatus: GeocodingStatus.Verified,
        }),
        updatedAt: new Date(),
      };
    }

    case 'RESTORE_SESSION':
      return action.payload;
    case 'START_NEW_ROUTE':
      return action.payload;
    default:
      return state;
  }
}
