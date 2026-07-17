import type { Delivery } from './Delivery.js';

export interface RouteSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  deliveries: Delivery[];
}
