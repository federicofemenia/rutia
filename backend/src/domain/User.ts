import type { UserRole } from './UserRole.js';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  /** `null` solo para `SUPER_ADMIN` — `COMPANY_ADMIN`/`DRIVER` siempre pertenecen a una empresa. */
  companyId: string | null;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
