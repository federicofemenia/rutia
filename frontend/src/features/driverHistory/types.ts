import type { Delivery } from '../route';

export interface DriverHistorySummary {
  id: string;
  finishedAt: string;
  totalDeliveries: number;
  deliveredCount: number;
  failedCount: number;
}

export interface DriverHistoryDetail {
  id: string;
  finishedAt: string;
  deliveries: Delivery[];
}
