import { createInterface } from 'node:readline';
import { env } from '../infrastructure/config/env.js';
import { createDatabaseClient } from '../infrastructure/database/createDatabaseClient.js';

const CONFIRMATION_WORD = 'BORRAR';

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/** Nunca imprime `authToken` — solo el host, que alcanza para confirmar el destino. */
function describeTarget(): string {
  if (env.database.provider === 'turso') {
    return `Turso (${new URL(env.database.url.replace(/^libsql:/, 'https:')).host})`;
  }

  return `SQLite (${env.database.path})`;
}

/**
 * Borra TODOS los usuarios y sus sesiones de ruta guardadas. Uso:
 *   npm run database:reset-users
 * Manual y explícito a propósito: nunca corre como parte de migrate()/createDatabase() ni de
 * ningún deploy automático — es una decisión operativa de una sola vez para arrancar de cero con
 * el modelo multiempresa, no un paso repetible del ciclo de vida normal de la app.
 */
async function main() {
  const target = describeTarget();
  console.log(`Esto borra TODOS los usuarios y sesiones de ruta en: ${target}`);

  const confirmation = await prompt(`Escribí "${CONFIRMATION_WORD}" para confirmar: `);

  if (confirmation !== CONFIRMATION_WORD) {
    console.log('Cancelado — no se borró nada.');
    return;
  }

  const client = createDatabaseClient(env.database);

  try {
    await client.execute('DELETE FROM route_sessions');
    await client.execute('DELETE FROM users');
    console.log(`Listo: se borraron todos los usuarios y sesiones de ruta en ${target}.`);
  } finally {
    client.close();
  }
}

main();
