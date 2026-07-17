export const UserRole = {
  Chofer: 'chofer',
  Admin: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}
