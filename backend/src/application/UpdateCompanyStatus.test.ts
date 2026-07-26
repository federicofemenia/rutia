import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { UpdateCompanyStatus } from './UpdateCompanyStatus.js';

const EXISTING_COMPANY: Company = {
  id: 'company-1',
  name: 'Acme',
  legalName: null,
  taxId: null,
  contactEmail: null,
  registrationCodeHash: 'hash',
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

test('desactiva la empresa y persiste el cambio', async () => {
  const companyRepository = new StubCompanyRepository(new Map([[EXISTING_COMPANY.id, EXISTING_COMPANY]]));
  const useCase = new UpdateCompanyStatus(companyRepository);

  const result = await useCase.execute('company-1', false);

  assert.equal(result?.active, false);
  assert.equal(companyRepository.updated?.active, false);
});

test('devuelve null si la empresa no existe', async () => {
  const useCase = new UpdateCompanyStatus(new StubCompanyRepository(new Map()));

  assert.equal(await useCase.execute('id-inexistente', false), null);
});
