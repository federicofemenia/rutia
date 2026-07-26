import type { User } from './User.js';

export interface UserRepository {
  findByName(name: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<void>;
  /** Solo devuelve el usuario si su rol es DRIVER — sin scoping por empresa (uso: SUPER_ADMIN). */
  findDriverById(id: string): Promise<User | null>;
  /** Igual que `findDriverById`, pero exige además que pertenezca a `companyId` (uso: COMPANY_ADMIN). */
  findDriverByIdAndCompany(id: string, companyId: string): Promise<User | null>;
  listDriversByCompany(companyId: string): Promise<User[]>;
}
