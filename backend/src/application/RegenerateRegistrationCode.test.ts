import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { hashRegistrationCode } from '../domain/registrationCodeHashing.js';
import { RegenerateRegistrationCode } from './RegenerateRegistrationCode.js';

const SECRET = 'test-secret';

const EXISTING_COMPANY: Company = {
  id: 'company-1',
  name: 'Acme',
  legalName: null,
  taxId: null,
  contactEmail: null,
  registrationCodeHash: 'old-hash',
  registrationEnabled: true,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

class StubCompanyRepository implements CompanyRepository {
  public updated: Company | undefined;

  constructor(private readonly companiesById: Map<string, Company>) {}

  async create(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async update(company: Company): Promise<void> {
    this.updated = company;
  }

  async findById(id: string): Promise<Company | null> {
    return this.companiesById.get(id) ?? null;
  }

  async findByRegistrationCodeHash(): Promise<Company | null> {
    throw new Error('no usado en este test');
  }
}

test('regenera el código, persiste el nuevo hash y devuelve el código en texto plano', async () => {
  const companyRepository = new StubCompanyRepository(new Map([[EXISTING_COMPANY.id, EXISTING_COMPANY]]));
  const useCase = new RegenerateRegistrationCode(companyRepository, SECRET);

  const result = await useCase.execute(EXISTING_COMPANY.id);

  assert.ok(result);
  assert.notEqual(result?.company.registrationCodeHash, EXISTING_COMPANY.registrationCodeHash);
  assert.equal(result?.company.registrationCodeHash, hashRegistrationCode(result?.registrationCode ?? '', SECRET));
  assert.deepEqual(companyRepository.updated, result?.company);
});

test('devuelve null si la empresa no existe', async () => {
  const companyRepository = new StubCompanyRepository(new Map());
  const useCase = new RegenerateRegistrationCode(companyRepository, SECRET);

  assert.equal(await useCase.execute('id-inexistente'), null);
});
