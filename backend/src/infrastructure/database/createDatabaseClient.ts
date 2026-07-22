import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import type { DatabaseConfig } from './DatabaseConfig.js';

/**
 * Crea el cliente de libSQL según el proveedor configurado. Importa `@libsql/client` (build de
 * Node, con soporte de archivo local nativo) y nunca `@libsql/client/web` — este backend corre
 * siempre en Node, no en un runtime edge/browser.
 */
export function createDatabaseClient(config: DatabaseConfig): Client {
  if (config.provider === 'turso') {
    return createClient({ url: config.url, authToken: config.authToken });
  }

  if (config.path !== ':memory:') {
    mkdirSync(dirname(config.path), { recursive: true });
  }

  return createClient({ url: `file:${config.path}` });
}
