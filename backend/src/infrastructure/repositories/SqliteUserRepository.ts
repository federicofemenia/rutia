import type { Client, Row } from '@libsql/client';
import type { User } from '../../domain/User.js';
import type { UserRepository } from '../../domain/UserRepository.js';
import { UserRole } from '../../domain/UserRole.js';

const USER_ROLES = new Set<string>(Object.values(UserRole));

function isUserRole(value: string): value is UserRole {
  return USER_ROLES.has(value);
}

/**
 * Mapea una fila cruda de libSQL a `User`, validando cada columna explícitamente en vez de
 * castear la fila entera (`row as User`): las columnas de libSQL llegan tipadas como `Value`
 * (`string | number | bigint | null | ArrayBuffer`), no hay garantía estática de que
 * `id`/`name`/etc. sean realmente texto.
 */
function toUser(row: Row): User {
  const { id, name, role, password_hash: passwordHash, created_at: createdAt } = row;

  if (typeof id !== 'string') {
    throw new Error('Fila de "users" con "id" no textual.');
  }
  if (typeof name !== 'string') {
    throw new Error('Fila de "users" con "name" no textual.');
  }
  if (typeof role !== 'string' || !isUserRole(role)) {
    throw new Error(`Fila de "users" con "role" inválido: ${String(role)}.`);
  }
  if (typeof passwordHash !== 'string') {
    throw new Error('Fila de "users" con "password_hash" no textual.');
  }
  if (typeof createdAt !== 'string') {
    throw new Error('Fila de "users" con "created_at" no textual.');
  }

  return { id, name, role, passwordHash, createdAt };
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly client: Client) {}

  async findByName(name: string): Promise<User | null> {
    const result = await this.client.execute({
      sql: 'SELECT * FROM users WHERE LOWER(name) = LOWER(?)',
      args: [name],
    });
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async create(user: User): Promise<void> {
    await this.client.execute({
      sql: 'INSERT INTO users (id, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [user.id, user.name, user.role, user.passwordHash, user.createdAt],
    });
  }
}
