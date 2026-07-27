import type { RouteSession } from './RouteSession.js';

/** Una foto archivada de una `RouteSession` ya finalizada — nunca se pisa. */
export interface RouteSessionHistoryEntry {
  id: string;
  finishedAt: string;
  session: RouteSession;
}
