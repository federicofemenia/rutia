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
  {
    // Multi-empresa (SUPER_ADMIN/COMPANY_ADMIN/DRIVER) — ver docs del plan de la sesión. El
    // código de registro se guarda hasheado (nunca en texto plano), y se busca por igualdad
    // exacta del hash — el índice UNIQUE es lo que hace esa búsqueda O(1) en vez de iterar todas
    // las empresas.
    id: '0002_create_companies_table',
    statements: [
      `CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        legal_name TEXT,
        tax_id TEXT,
        contact_email TEXT,
        registration_code_hash TEXT NOT NULL,
        registration_enabled INTEGER NOT NULL DEFAULT 1,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_registration_code_hash ON companies(registration_code_hash)`,
    ],
  },
  {
    // Aditiva: no toca los usuarios existentes más que darles `active=1` y copiar `updated_at`
    // desde `created_at` — el código viejo que no conoce estas columnas sigue funcionando igual
    // (SqliteUserRepository.toUser hoy solo lee las columnas que ya conocía).
    id: '0003_add_multitenancy_columns_to_users',
    statements: [
      'ALTER TABLE users ADD COLUMN company_id TEXT REFERENCES companies(id)',
      'ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1',
      "ALTER TABLE users ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
      "UPDATE users SET updated_at = created_at WHERE updated_at = ''",
      'CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role)',
    ],
  },
  {
    // `route_sessions` sigue siendo "la ruta actual" del chofer (una fila por usuario, se pisa en
    // cada guardado — sin cambios). Esta tabla nueva es el archivo histórico: cuando el chofer
    // toca "Terminar recorrido", se copia ahí una foto de esa sesión, en un registro nuevo que
    // nunca se pisa — es lo que permite después consultar rutas pasadas. `status` de la sesión
    // ("in_progress"/"finished") viaja dentro del `session_json` existente (mismo campo agregado a
    // `RouteSession` en el dominio) — no hace falta una columna nueva en `route_sessions` para eso.
    id: '0004_create_route_session_history_table',
    statements: [
      `CREATE TABLE IF NOT EXISTS route_session_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_json TEXT NOT NULL,
        finished_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      'CREATE INDEX IF NOT EXISTS idx_route_session_history_user_id ON route_session_history(user_id)',
    ],
  },
];
