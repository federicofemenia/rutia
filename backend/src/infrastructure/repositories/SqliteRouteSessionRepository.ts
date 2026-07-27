import { randomUUID } from 'node:crypto';
import type { Client, Row } from '@libsql/client';
import type { RouteSession } from '../../domain/RouteSession.js';
import type { RouteSessionHistoryEntry } from '../../domain/RouteSessionHistoryEntry.js';
import type { RouteSessionRepository } from '../../domain/RouteSessionRepository.js';
import { RouteSessionStatus } from '../../domain/RouteSessionStatus.js';

const ROUTE_SESSION_STATUSES = new Set<string>(Object.values(RouteSessionStatus));

function isRouteSessionStatus(value: unknown): value is RouteSessionStatus {
  return typeof value === 'string' && ROUTE_SESSION_STATUSES.has(value);
}

function hasRouteSessionShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    Array.isArray(candidate.deliveries)
  );
}

/**
 * `session_json` es JSON de confianza limitada (lo escribió el frontend, dueño de ese modelo) —
 * se valida que el JSON sea sintácticamente válido y tenga la forma mínima esperada de
 * `RouteSession` antes de confiar en el cast; cualquier otra cosa se trata igual que un parseo
 * fallido (mismo comportamiento que ya existía, ahora también cubre "JSON válido pero con otra
 * forma"). `status` es un campo agregado después: las sesiones guardadas antes de que existiera
 * no lo tienen en su JSON — se asume `in_progress` (eran, por definición, la ruta "actual" del
 * chofer bajo el modelo viejo) en vez de descartar la fila entera.
 */
function parseSessionJson(sessionJson: string): RouteSession | null {
  try {
    const parsed: unknown = JSON.parse(sessionJson);

    if (!hasRouteSessionShape(parsed)) {
      return null;
    }

    const status = isRouteSessionStatus(parsed.status) ? parsed.status : RouteSessionStatus.InProgress;
    return { id: parsed.id, createdAt: parsed.createdAt, updatedAt: parsed.updatedAt, deliveries: parsed.deliveries, status } as RouteSession;
  } catch {
    return null;
  }
}

function toRouteSession(row: Row): RouteSession | null {
  const sessionJson = row.session_json;

  if (typeof sessionJson !== 'string') {
    throw new Error('Fila de "route_sessions" con "session_json" no textual.');
  }

  return parseSessionJson(sessionJson);
}

/** Igual criterio defensivo que `toRouteSession`: una fila corrupta se descarta, no rompe la consulta entera. */
function toHistoryEntry(row: Row): RouteSessionHistoryEntry | null {
  const { id, session_json: sessionJson, finished_at: finishedAt } = row;

  if (typeof id !== 'string' || typeof sessionJson !== 'string' || typeof finishedAt !== 'string') {
    throw new Error('Fila de "route_session_history" con columnas no textuales.');
  }

  const session = parseSessionJson(sessionJson);
  return session ? { id, finishedAt, session } : null;
}

export class SqliteRouteSessionRepository implements RouteSessionRepository {
  constructor(private readonly client: Client) {}

  async findByUserId(userId: string): Promise<RouteSession | null> {
    const result = await this.client.execute({
      sql: 'SELECT session_json FROM route_sessions WHERE user_id = ?',
      args: [userId],
    });
    const row = result.rows[0];
    return row ? toRouteSession(row) : null;
  }

  async save(userId: string, session: RouteSession): Promise<void> {
    await this.client.execute({
      sql: `INSERT INTO route_sessions (user_id, session_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET session_json = excluded.session_json, updated_at = excluded.updated_at`,
      args: [userId, JSON.stringify(session), session.updatedAt],
    });
  }

  async archiveFinishedSession(userId: string, session: RouteSession): Promise<void> {
    await this.client.execute({
      sql: `INSERT INTO route_session_history (id, user_id, session_json, finished_at)
            VALUES (?, ?, ?, ?)`,
      args: [randomUUID(), userId, JSON.stringify(session), session.updatedAt],
    });
  }

  async findHistoryByUserId(userId: string): Promise<RouteSessionHistoryEntry[]> {
    const result = await this.client.execute({
      sql: 'SELECT id, session_json, finished_at FROM route_session_history WHERE user_id = ? ORDER BY finished_at DESC',
      args: [userId],
    });

    return result.rows
      .map((row) => toHistoryEntry(row))
      .filter((entry): entry is RouteSessionHistoryEntry => entry !== null);
  }

  async findHistoryEntryById(id: string, userId: string): Promise<RouteSessionHistoryEntry | null> {
    const result = await this.client.execute({
      sql: 'SELECT id, session_json, finished_at FROM route_session_history WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    const row = result.rows[0];
    return row ? toHistoryEntry(row) : null;
  }
}
