import type { DatabaseConfig } from '../database/DatabaseConfig.js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

const DEFAULT_SQLITE_PATH = './data/rutia.sqlite';

/**
 * `DATABASE_PROVIDER` es obligatorio y debe ser exactamente "sqlite" o "turso" — no hay default
 * implícito para esta variable puntual, porque decide qué otras variables son obligatorias y un
 * valor mal tipeado (ej. "trufa") no debe caer silenciosamente en un modo u otro.
 */
function readDatabaseConfig(): DatabaseConfig {
  const provider = process.env.DATABASE_PROVIDER;

  if (provider === 'turso') {
    return {
      provider: 'turso',
      url: requireEnv('TURSO_DATABASE_URL'),
      authToken: requireEnv('TURSO_AUTH_TOKEN'),
    };
  }

  if (provider === 'sqlite') {
    // DATABASE_PATH sí tiene default: a diferencia del proveedor, la ubicación del archivo es un
    // detalle razonable de omitir en desarrollo local, y el default queda documentado acá y en
    // .env.example.
    return {
      provider: 'sqlite',
      path: process.env.DATABASE_PATH ?? DEFAULT_SQLITE_PATH,
    };
  }

  throw new Error(`DATABASE_PROVIDER inválido: "${provider ?? ''}". Debe ser "sqlite" o "turso".`);
}

export const env = {
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
  geoapifyApiKey: requireEnv('GEOAPIFY_API_KEY'),
  port: Number(process.env.PORT ?? 3000),
  database: readDatabaseConfig(),
  jwtSecret: requireEnv('JWT_SECRET'),
};
