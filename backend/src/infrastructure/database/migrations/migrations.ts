import type { Migration } from './Migration.js';

/**
 * Migraciones versionadas, en el orden en que deben aplicarse. Solo forward — no hay "down" en
 * esta etapa. `0001_init` reproduce exactamente el esquema que ya existía (creado antes inline en
 * `createDatabase.ts` con `CREATE TABLE IF NOT EXISTS`); acá queda versionado por primera vez,
 * pero el esquema en sí no cambia.
 */
export const migrations: Migration[] = [
  {
    id: '0001_init',
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS route_sessions (
        user_id TEXT PRIMARY KEY,
        session_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
    ],
  },
];
