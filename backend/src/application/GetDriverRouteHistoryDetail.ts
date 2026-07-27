import type { RouteSessionHistoryEntry } from '../domain/RouteSessionHistoryEntry.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';

export class GetDriverRouteHistoryDetail {
  constructor(private readonly routeSessionRepository: RouteSessionRepository) {}

  async execute(id: string, userId: string): Promise<RouteSessionHistoryEntry | null> {
    return this.routeSessionRepository.findHistoryEntryById(id, userId);
  }
}
