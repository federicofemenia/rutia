export interface Company {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  contactEmail: string | null;
  registrationCodeHash: string;
  registrationEnabled: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
