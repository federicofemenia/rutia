import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { hashRegistrationCode } from '../domain/registrationCodeHashing.js';
import { CreateCompany } from './CreateCompany.js';

const SECRET = 'test-secret';

class StubCompanyRepository implements CompanyRepository {
  public created: Company | undefined;

  async create(company: Company): Promise<void> {
    this.created = company;
  }

  async update(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async findById(): Promise<Company | null> {
    throw new Error('no usado en este test');
  }

  async findByRegistrationCodeHash(): Promise<Company | null> {
    throw new Error('no usado en este test');
  }
}

test('crea la empresa activa, con registro habilitado, y devuelve el código en texto plano', async () => {
  const companyRepository = new StubCompanyRepository();
  const useCase = new CreateCompany(companyRepository, SECRET);

  const result = await useCase.execute({ name: 'Acme' });

  assert.equal(result.company.name, 'Acme');
  assert.equal(result.company.active, true);
  assert.equal(result.company.registrationEnabled, true);
  assert.equal(companyRepository.created, result.company);
  assert.equal(result.company.registrationCodeHash, hashRegistrationCode(result.registrationCode, SECRET));
});

test('campos opcionales ausentes quedan en null', async () => {
  const companyRepository = new StubCompanyRepository();
  const useCase = new CreateCompany(companyRepository, SECRET);

  const result = await useCase.execute({ name: 'Acme' });

  assert.equal(result.company.legalName, null);
  assert.equal(result.company.taxId, null);
  assert.equal(result.company.contactEmail, null);
});

test('dos empresas creadas seguidas obtienen códigos de registro distintos', async () => {
  const companyRepository = new StubCompanyRepository();
  const useCase = new CreateCompany(companyRepository, SECRET);

  const first = await useCase.execute({ name: 'Acme' });
  const second = await useCase.execute({ name: 'Beta' });

  assert.notEqual(first.registrationCode, second.registrationCode);
});
