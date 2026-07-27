import type { RouteSession } from './RouteSession.js';
import type { RouteSessionHistoryEntry } from './RouteSessionHistoryEntry.js';

export interface RouteSessionRepository {
  findByUserId(userId: string): Promise<RouteSession | null>;
  save(userId: string, session: RouteSession): Promise<void>;
  /** Archiva una copia de la sesión finalizada — nunca se pisa, es lo que arma el histórico. */
  archiveFinishedSession(userId: string, session: RouteSession): Promise<void>;
  /** Más reciente primero. */
  findHistoryByUserId(userId: string): Promise<RouteSessionHistoryEntry[]>;
  /** `id` + `userId` en la misma búsqueda — nunca `findById` seguido de chequear el dueño después. */
  findHistoryEntryById(id: string, userId: string): Promise<RouteSessionHistoryEntry | null>;
}
