import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { generateRegistrationCode } from '../domain/generateRegistrationCode.js';
import { hashRegistrationCode } from '../domain/registrationCodeHashing.js';

export interface RegenerateRegistrationCodeResult {
  company: Company;
  /** Texto plano — solo se devuelve acá, esta única vez. */
  registrationCode: string;
}

export class RegenerateRegistrationCode {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly registrationCodeSecret: string,
  ) {}

  async execute(companyId: string): Promise<RegenerateRegistrationCodeResult | null> {
    const existing = await this.companyRepository.findById(companyId);
    if (!existing) {
      return null;
    }

    const registrationCode = generateRegistrationCode();
    const company: Company = {
      ...existing,
      registrationCodeHash: hashRegistrationCode(registrationCode, this.registrationCodeSecret),
      updatedAt: new Date().toISOString(),
    };

    await this.companyRepository.update(company);

    return { company, registrationCode };
  }
}
