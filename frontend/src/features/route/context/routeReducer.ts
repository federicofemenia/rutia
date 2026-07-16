import type { Delivery, RouteSession } from '../types';

export type RouteAction =
  | { type: 'ADD_DELIVERY'; payload: Delivery }
  | { type: 'REMOVE_DELIVERY'; payload: { id: string } }
  | { type: 'REORDER_DELIVERIES'; payload: Delivery[] }
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
    case 'RESTORE_SESSION':
      return action.payload;
    case 'START_NEW_ROUTE':
      return action.payload;
    default:
      return state;
  }
}
