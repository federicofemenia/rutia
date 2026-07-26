import { randomUUID } from 'node:crypto';
import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { generateRegistrationCode } from '../domain/generateRegistrationCode.js';
import { hashRegistrationCode } from '../domain/registrationCodeHashing.js';

export interface CreateCompanyInput {
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  contactEmail?: string | null;
}

export interface CreateCompanyResult {
  company: Company;
  /** Texto plano — solo se devuelve acá, esta única vez. Ninguna consulta posterior lo expone. */
  registrationCode: string;
}

export class CreateCompany {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly registrationCodeSecret: string,
  ) {}

  async execute(input: CreateCompanyInput): Promise<CreateCompanyResult> {
    const registrationCode = generateRegistrationCode();
    const now = new Date().toISOString();

    const company: Company = {
      id: randomUUID(),
      name: input.name,
      legalName: input.legalName ?? null,
      taxId: input.taxId ?? null,
      contactEmail: input.contactEmail ?? null,
      registrationCodeHash: hashRegistrationCode(registrationCode, this.registrationCodeSecret),
      registrationEnabled: true,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.companyRepository.create(company);

    return { company, registrationCode };
  }
}
