import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';

export class GetRouteSession {
  constructor(private readonly routeSessionRepository: RouteSessionRepository) {}

  execute(userId: string): Promise<RouteSession | null> {
    return this.routeSessionRepository.findByUserId(userId);
  }
}
