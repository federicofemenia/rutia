import { DeliveryStatus, type Delivery } from '../types';

export function selectNextDelivery(deliveries: Delivery[]): Delivery | null {
  const inProgress = deliveries.find((delivery) => delivery.status === DeliveryStatus.InProgress);

  if (inProgress) {
    return inProgress;
  }

  return deliveries.find((delivery) => delivery.status === DeliveryStatus.Pending) ?? null;
}
