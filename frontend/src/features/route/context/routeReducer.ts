import type { Delivery, RouteSession } from '../types';

export type RouteAction =
  | { type: 'ADD_DELIVERY'; payload: Delivery }
  | { type: 'REMOVE_DELIVERY'; payload: { id: string } }
  | { type: 'REORDER_DELIVERIES'; payload: Delivery[] }
  | { type: 'START_NEW_ROUTE'; payload: RouteSession };

export function createRouteSession(): RouteSession {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    deliveries: [],
  };
}

export function routeReducer(state: RouteSession, action: RouteAction): RouteSession {
  switch (action.type) {
    case 'ADD_DELIVERY':
      return { ...state, deliveries: [...state.deliveries, action.payload] };
    case 'REMOVE_DELIVERY':
      return { ...state, deliveries: state.deliveries.filter((delivery) => delivery.id !== action.payload.id) };
    case 'REORDER_DELIVERIES':
      return { ...state, deliveries: action.payload };
    case 'START_NEW_ROUTE':
      return action.payload;
    default:
      return state;
  }
}
