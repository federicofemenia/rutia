import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import { normalizeUsername } from '../domain/normalizeUsername.js';
import { hashPassword } from '../domain/passwordHashing.js';
import { isPasswordValid, MIN_PASSWORD_LENGTH } from '../domain/passwordPolicy.js';
import { UserRole } from '../domain/UserRole.js';
import { env } from '../infrastructure/config/env.js';
import { createDatabase } from '../infrastructure/database/createDatabase.js';
import { SqliteUserRepository } from '../infrastructure/repositories/SqliteUserRepository.js';
import { promptHidden } from './promptHidden.js';

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Crea el único SUPER_ADMIN inicial del sistema (companyId null). Uso:
 *   npm run user:create-super-admin
 * Pide usuario/contraseña por consola en vez de recibirlos como argumentos — así nunca quedan en
 * el historial de la shell ni en logs de proceso. No es un endpoint público.
 */
async function main() {
  const username = normalizeUsername(await prompt('Usuario del SUPER_ADMIN: '));

  if (username.length === 0) {
    console.error('El usuario no puede estar vacío.');
    process.exitCode = 1;
    return;
  }

  const password = await promptHidden('Contraseña: ');

  if (!isPasswordValid(password)) {
    console.error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    process.exitCode = 1;
    return;
  }

  const passwordConfirmation = await promptHidden('Confirmar contraseña: ');

  if (password !== passwordConfirmation) {
    console.error('Las contraseñas no coinciden.');
    process.exitCode = 1;
    return;
  }

  const database = await createDatabase(env.database);
  const userRepository = new SqliteUserRepository(database);

  try {
    const existing = await userRepository.findByName(username);

    if (existing) {
      console.error(`Ya existe un usuario "${username}".`);
      process.exitCode = 1;
      return;
    }

    const now = new Date().toISOString();
    await userRepository.create({
      id: randomUUID(),
      name: username,
      role: UserRole.SuperAdmin,
      companyId: null,
      passwordHash: hashPassword(password),
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`SUPER_ADMIN "${username}" creado correctamente.`);
  } finally {
    database.close();
  }
}

main();
