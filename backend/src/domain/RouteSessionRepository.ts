import type { RouteSession } from './RouteSession.js';

export interface RouteSessionRepository {
  findByUserId(userId: string): Promise<RouteSession | null>;
  save(userId: string, session: RouteSession): Promise<void>;
  /** Archiva una copia de la sesión finalizada — nunca se pisa, es lo que arma el histórico. */
  archiveFinishedSession(userId: string, session: RouteSession): Promise<void>;
}
