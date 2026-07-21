import type { Client, Row } from '@libsql/client';
import type { RouteSession } from '../../domain/RouteSession.js';
import type { RouteSessionRepository } from '../../domain/RouteSessionRepository.js';

function hasRouteSessionShape(value: unknown): value is RouteSession {
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
 * forma").
 */
function parseSessionJson(sessionJson: string): RouteSession | null {
  try {
    const parsed: unknown = JSON.parse(sessionJson);
    return hasRouteSessionShape(parsed) ? parsed : null;
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
}
