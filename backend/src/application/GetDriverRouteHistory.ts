import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { RouteSessionHistoryEntry } from '../domain/RouteSessionHistoryEntry.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';

export interface DriverRouteHistorySummary {
  id: string;
  finishedAt: string;
  totalDeliveries: number;
  deliveredCount: number;
  failedCount: number;
}

/** Compartido con `GetAdminDriverRouteHistory` — mismo recorte a DTO liviano para ambos casos de uso. */
export function toDriverRouteHistorySummary({ id, finishedAt, session }: RouteSessionHistoryEntry): DriverRouteHistorySummary {
  return {
    id,
    finishedAt,
    totalDeliveries: session.deliveries.length,
    deliveredCount: session.deliveries.filter((delivery) => delivery.status === DeliveryStatus.Delivered).length,
    failedCount: session.deliveries.filter((delivery) => delivery.status === DeliveryStatus.Failed).length,
  };
}

export class GetDriverRouteHistory {
  constructor(private readonly routeSessionRepository: RouteSessionRepository) {}

  async execute(userId: string): Promise<DriverRouteHistorySummary[]> {
    const entries = await this.routeSessionRepository.findHistoryByUserId(userId);
    return entries.map(toDriverRouteHistorySummary);
  }
}
