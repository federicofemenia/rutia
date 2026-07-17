import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * SQLite vía el módulo nativo `node:sqlite` — sin dependencias nuevas. Elegido para el MVP por
 * simplicidad (un solo archivo, sin infraestructura que levantar); se revisa antes de producción,
 * mismo criterio que ya se usó para Nominatim/OSRM.
 */
export function createDatabase(filePath: string): DatabaseSync {
  if (filePath !== ':memory:') {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  const db = new DatabaseSync(filePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Una fila por chofer: la última RouteSession que sincronizó, guardada tal cual como JSON.
  // No se modela cada entrega en columnas propias — el backend no necesita razonar sobre su
  // contenido, solo guardarlo y devolverlo (el frontend, dueño de ese modelo, ya sabe leerlo).
  db.exec(`
    CREATE TABLE IF NOT EXISTS route_sessions (
      user_id TEXT PRIMARY KEY,
      session_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  return db;
}
