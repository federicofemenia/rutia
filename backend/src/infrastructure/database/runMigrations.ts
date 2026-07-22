import type { Client } from '@libsql/client';
import type { Migration } from './migrations/Migration.js';

async function ensureSchemaMigrationsTable(client: Client): Promise<void> {
  await client.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
}

async function readAppliedMigrationIds(client: Client): Promise<Set<string>> {
  const result = await client.execute('SELECT id FROM schema_migrations');
  const ids = new Set<string>();

  for (const row of result.rows) {
    const id = row.id;
    if (typeof id !== 'string') {
      throw new Error('schema_migrations tiene una fila con "id" no textual.');
    }
    ids.add(id);
  }

  return ids;
}

/**
 * Aplica las migraciones pendientes, en el orden de la lista recibida. Cada migración corre en
 * un único batch atómico junto con el INSERT en `schema_migrations`: si cualquier sentencia
 * falla, `client.batch` revierte todo el batch (ni el esquema ni el registro quedan aplicados) y
 * se relanza el error para cortar el arranque — nunca queda una migración a medio aplicar ni
 * registrada sin haber corrido.
 *
 * `schema_migrations` se crea (si no existe) antes de poder consultar qué está aplicado.
 */
export async function runMigrations(client: Client, pending: Migration[]): Promise<void> {
  await ensureSchemaMigrationsTable(client);
  const applied = await readAppliedMigrationIds(client);

  for (const migration of pending) {
    if (applied.has(migration.id)) {
      continue;
    }

    try {
      await client.batch(
        [
          ...migration.statements,
          {
            sql: 'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)',
            args: [migration.id, new Date().toISOString()],
          },
        ],
        'write',
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`No se pudo aplicar la migración "${migration.id}": ${reason}`);
    }
  }
}
