import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';

export interface DriverRouteHistorySummary {
  id: string;
  finishedAt: string;
  totalDeliveries: number;
  deliveredCount: number;
  failedCount: number;
}

export class GetDriverRouteHistory {
  constructor(private readonly routeSessionRepository: RouteSessionRepository) {}

  async execute(userId: string): Promise<DriverRouteHistorySummary[]> {
    const entries = await this.routeSessionRepository.findHistoryByUserId(userId);

    return entries.map(({ id, finishedAt, session }) => ({
      id,
      finishedAt,
      totalDeliveries: session.deliveries.length,
      deliveredCount: session.deliveries.filter((delivery) => delivery.status === DeliveryStatus.Delivered).length,
      failedCount: session.deliveries.filter((delivery) => delivery.status === DeliveryStatus.Failed).length,
    }));
  }
}
