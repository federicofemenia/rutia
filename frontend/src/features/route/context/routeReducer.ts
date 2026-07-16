import { DeliveryStatus, type Delivery, type FailureReasonCode, type RouteSession } from '../types';

export type RouteAction =
  | { type: 'ADD_DELIVERY'; payload: Delivery }
  | { type: 'REMOVE_DELIVERY'; payload: { id: string } }
  | { type: 'REORDER_DELIVERIES'; payload: Delivery[] }
  | { type: 'START_DELIVERY'; payload: { id: string } }
  | { type: 'COMPLETE_DELIVERY'; payload: { id: string } }
  | { type: 'FAIL_DELIVERY'; payload: { id: string; failureReasonCode: FailureReasonCode; failureReasonDetail?: string } }
  | { type: 'RESTORE_SESSION'; payload: RouteSession }
  | { type: 'START_NEW_ROUTE'; payload: RouteSession };

export function createRouteSession(): RouteSession {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    deliveries: [],
  };
}

function updateDelivery(deliveries: Delivery[], id: string, update: Partial<Delivery>): Delivery[] {
  return deliveries.map((delivery) => (delivery.id === id ? { ...delivery, ...update } : delivery));
}

export function routeReducer(state: RouteSession, action: RouteAction): RouteSession {
  switch (action.type) {
    case 'ADD_DELIVERY':
      return { ...state, deliveries: [...state.deliveries, action.payload], updatedAt: new Date() };

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

    case 'COMPLETE_DELIVERY': {
      const target = state.deliveries.find((delivery) => delivery.id === action.payload.id);

      if (!target || target.status !== DeliveryStatus.InProgress) {
        return state;
      }

      return {
        ...state,
        deliveries: updateDelivery(state.deliveries, action.payload.id, {
          status: DeliveryStatus.Delivered,
          deliveredAt: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      };
    }

    case 'FAIL_DELIVERY': {
      const target = state.deliveries.find((delivery) => delivery.id === action.payload.id);

      if (!target || target.status !== DeliveryStatus.InProgress) {
        return state;
      }

      return {
        ...state,
        deliveries: updateDelivery(state.deliveries, action.payload.id, {
          status: DeliveryStatus.Failed,
          failureReasonCode: action.payload.failureReasonCode,
          failureReasonDetail: action.payload.failureReasonDetail,
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
