import type { Delivery } from './Delivery.js';
import type { RouteSessionStatus } from './RouteSessionStatus.js';

export interface RouteSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  deliveries: Delivery[];
  status: RouteSessionStatus;
}
