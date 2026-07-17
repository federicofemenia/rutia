import type { DatabaseSync } from 'node:sqlite';
import type { RouteSession } from '../../domain/RouteSession.js';
import type { RouteSessionRepository } from '../../domain/RouteSessionRepository.js';

interface RouteSessionRow {
  session_json: string;
}

export class SqliteRouteSessionRepository implements RouteSessionRepository {
  constructor(private readonly db: DatabaseSync) {}

  async findByUserId(userId: string): Promise<RouteSession | null> {
    const row = this.db.prepare('SELECT session_json FROM route_sessions WHERE user_id = ?').get(userId) as
      | RouteSessionRow
      | undefined;

    if (!row) {
      return null;
    }

    try {
      return JSON.parse(row.session_json) as RouteSession;
    } catch {
      return null;
    }
  }

  async save(userId: string, session: RouteSession): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO route_sessions (user_id, session_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET session_json = excluded.session_json, updated_at = excluded.updated_at`,
      )
      .run(userId, JSON.stringify(session), session.updatedAt);
  }
}
