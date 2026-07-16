import { DeliveryStatus, type Delivery } from '../types';

export type DeliveryStatusCounts = Record<DeliveryStatus, number>;

export function summarizeDeliveries(deliveries: Delivery[]): DeliveryStatusCounts {
  const counts: DeliveryStatusCounts = {
    [DeliveryStatus.Pending]: 0,
    [DeliveryStatus.InProgress]: 0,
    [DeliveryStatus.Delivered]: 0,
    [DeliveryStatus.Failed]: 0,
  };

  for (const delivery of deliveries) {
    counts[delivery.status] += 1;
  }

  return counts;
}
