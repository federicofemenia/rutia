import type { Company } from './Company.js';

export interface CompanyRepository {
  create(company: Company): Promise<void>;
  update(company: Company): Promise<void>;
  findById(id: string): Promise<Company | null>;
  findByRegistrationCodeHash(registrationCodeHash: string): Promise<Company | null>;
}
