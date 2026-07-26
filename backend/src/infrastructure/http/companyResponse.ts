import type { Company } from '../../domain/Company.js';

/** Nunca se serializa `registrationCodeHash` — ni en este helper ni en ningún controller de `companies`. */
export function toCompanyResponse(company: Company) {
  const { registrationCodeHash: _registrationCodeHash, ...rest } = company;
  return rest;
}
