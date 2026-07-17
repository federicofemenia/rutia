import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';

export class SaveRouteSession {
  constructor(private readonly routeSessionRepository: RouteSessionRepository) {}

  execute(userId: string, session: RouteSession): Promise<void> {
    return this.routeSessionRepository.save(userId, session);
  }
}
