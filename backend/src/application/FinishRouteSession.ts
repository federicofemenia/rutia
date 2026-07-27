import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import { RouteSessionStatus } from '../domain/RouteSessionStatus.js';

export type FinishRouteSessionFailureReason = 'no-active-route' | 'deliveries-still-pending';

export type FinishRouteSessionResult =
  | { success: true; session: RouteSession }
  | { success: false; reason: FinishRouteSessionFailureReason };

const UNRESOLVED_STATUSES: DeliveryStatus[] = [DeliveryStatus.Pending, DeliveryStatus.InProgress];

export class FinishRouteSession {
  constructor(private readonly routeSessionRepository: RouteSessionRepository) {}

  async execute(userId: string): Promise<FinishRouteSessionResult> {
    const current = await this.routeSessionRepository.findByUserId(userId);

    if (!current) {
      return { success: false, reason: 'no-active-route' };
    }

    // No se confía en que el frontend ya haya validado esto — un cliente desactualizado o
    // manipulado no debería poder cerrar una ruta con entregas todavía sin resolver. `status`
    // ausente (formato viejo/entrega recién creada) cuenta como sin resolver.
    if (current.deliveries.some((delivery) => !delivery.status || UNRESOLVED_STATUSES.includes(delivery.status))) {
      return { success: false, reason: 'deliveries-still-pending' };
    }

    const finished: RouteSession = { ...current, status: RouteSessionStatus.Finished, updatedAt: new Date().toISOString() };

    await this.routeSessionRepository.save(userId, finished);
    await this.routeSessionRepository.archiveFinishedSession(userId, finished);

    return { success: true, session: finished };
  }
}
