import type { UserRole } from './UserRole.js';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}
