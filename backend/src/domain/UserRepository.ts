import type { User } from './User.js';

export interface UserRepository {
  findByName(name: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<void>;
}
