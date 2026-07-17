import type { RouteSession } from './RouteSession.js';

export interface RouteSessionRepository {
  findByUserId(userId: string): Promise<RouteSession | null>;
  save(userId: string, session: RouteSession): Promise<void>;
}
