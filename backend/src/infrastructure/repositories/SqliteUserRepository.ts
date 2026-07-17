import type { DatabaseSync } from 'node:sqlite';
import type { User } from '../../domain/User.js';
import type { UserRepository } from '../../domain/UserRepository.js';
import type { UserRole } from '../../domain/UserRole.js';

interface UserRow {
  id: string;
  name: string;
  role: string;
  password_hash: string;
  created_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role as UserRole,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: DatabaseSync) {}

  async findByName(name: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE LOWER(name) = LOWER(?)').get(name) as UserRow | undefined;
    return row ? toUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? toUser(row) : null;
  }

  async create(user: User): Promise<void> {
    this.db
      .prepare('INSERT INTO users (id, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, user.name, user.role, user.passwordHash, user.createdAt);
  }
}
