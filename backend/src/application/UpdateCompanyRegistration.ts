import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';

export class UpdateCompanyRegistration {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(companyId: string, registrationEnabled: boolean): Promise<Company | null> {
    const existing = await this.companyRepository.findById(companyId);
    if (!existing) {
      return null;
    }

    const company: Company = { ...existing, registrationEnabled, updatedAt: new Date().toISOString() };
    await this.companyRepository.update(company);

    return company;
  }
}
