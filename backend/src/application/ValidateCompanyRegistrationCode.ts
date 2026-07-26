import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { hashRegistrationCode } from '../domain/registrationCodeHashing.js';
import type { TokenService } from '../domain/TokenService.js';

export interface ValidateCompanyRegistrationCodeResult {
  companyName: string;
  registrationToken: string;
}

/**
 * `findByRegistrationCodeHash` ya filtra por `active = 1 AND registration_enabled = 1` en la
 * query — así que "código inexistente", "empresa inactiva" y "registro deshabilitado" colapsan
 * naturalmente en el mismo resultado (`null`), sin tener que decidir acá qué distinguir para no
 * filtrar información a quien está probando códigos al azar.
 */
export class ValidateCompanyRegistrationCode {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly tokenService: TokenService,
    private readonly registrationCodeSecret: string,
  ) {}

  async execute(code: string): Promise<ValidateCompanyRegistrationCodeResult | null> {
    const hash = hashRegistrationCode(code, this.registrationCodeSecret);
    const company = await this.companyRepository.findByRegistrationCodeHash(hash);

    if (!company) {
      return null;
    }

    const registrationToken = this.tokenService.sign({ purpose: 'driver-registration', companyId: company.id });
    return { companyName: company.name, registrationToken };
  }
}
