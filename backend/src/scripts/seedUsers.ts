import { randomUUID } from 'node:crypto';
import { hashPassword } from '../domain/passwordHashing.js';
import { UserRole } from '../domain/UserRole.js';
import { createDatabase } from '../infrastructure/database/createDatabase.js';
import { env } from '../infrastructure/config/env.js';
import { SqliteUserRepository } from '../infrastructure/repositories/SqliteUserRepository.js';

/**
 * Crea las cuentas de prueba para desarrollo (chofer/admin) si todavía no existen. Uso:
 *   pnpm run db:seed
 * Contraseñas de desarrollo fijas y de bajo riesgo a propósito — cambiar antes de cualquier
 * despliegue real (todavía no hay UI de gestión de usuarios, es intencional para este MVP).
 */
const DEV_ACCOUNTS = [
  { name: 'chofer', password: 'chofer123', role: UserRole.Chofer },
  { name: 'admin', password: 'admin123', role: UserRole.Admin },
  { name: 'anabelen', password: 'chofer123', role: UserRole.Chofer },
  { name: 'federico', password: 'chofer123', role: UserRole.Chofer },
];

async function main() {
  const database = await createDatabase(env.database);
  const userRepository = new SqliteUserRepository(database);

  for (const account of DEV_ACCOUNTS) {
    const existing = await userRepository.findByName(account.name);

    if (existing) {
      console.log(`Ya existe el usuario "${account.name}" (rol ${existing.role}) — se omite.`);
      continue;
    }

    await userRepository.create({
      id: randomUUID(),
      name: account.name,
      role: account.role,
      passwordHash: hashPassword(account.password),
      createdAt: new Date().toISOString(),
    });

    console.log(`Usuario creado: "${account.name}" / "${account.password}" (rol ${account.role})`);
  }

  database.close();
}

main();
