import type { Client } from '@libsql/client';
import type { DatabaseConfig } from './DatabaseConfig.js';
import { createDatabaseClient } from './createDatabaseClient.js';
import { migrations } from './migrations/migrations.js';
import { runMigrations } from './runMigrations.js';

/**
 * Punto único de entrada: crea el cliente (SQLite local/memoria o Turso, según `config`) y deja
 * la base al día antes de devolverlo — nunca hay que acordarse de correr migraciones aparte en
 * cada lugar que abre una conexión.
 */
export async function createDatabase(config: DatabaseConfig): Promise<Client> {
  const client = createDatabaseClient(config);
  await runMigrations(client, migrations);
  return client;
}
