export const UserRole = {
  SuperAdmin: 'super_admin',
  CompanyAdmin: 'company_admin',
  Driver: 'driver',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
