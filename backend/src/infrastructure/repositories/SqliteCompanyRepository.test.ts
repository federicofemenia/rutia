import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient, type Client } from '@libsql/client';
import { runMigrations } from '../database/runMigrations.js';
import { migrations } from '../database/migrations/migrations.js';
import type { Company } from '../../domain/Company.js';
import { SqliteCompanyRepository } from './SqliteCompanyRepository.js';

async function createMigratedClient(): Promise<Client> {
  const client = createClient({ url: ':memory:' });
  await runMigrations(client, migrations);
  return client;
}

function buildCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 'company-1',
    name: 'Acme',
    legalName: null,
    taxId: null,
    contactEmail: null,
    registrationCodeHash: 'hash-1',
    registrationEnabled: true,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('create + findById devuelve la empresa creada', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteCompanyRepository(client);
  const company = buildCompany({ legalName: 'Acme S.A.', taxId: '30-1234-5', contactEmail: 'ops@acme.com' });

  await repository.create(company);
  const found = await repository.findById(company.id);

  assert.deepEqual(found, company);
});

test('findById devuelve null si no existe', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteCompanyRepository(client);

  assert.equal(await repository.findById('id-inexistente'), null);
});

test('findByRegistrationCodeHash encuentra la empresa por hash exacto', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteCompanyRepository(client);
  const company = buildCompany();
  await repository.create(company);

  const found = await repository.findByRegistrationCodeHash('hash-1');

  assert.deepEqual(found, company);
});

test('findByRegistrationCodeHash devuelve null si la empresa está inactiva', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteCompanyRepository(client);
  await repository.create(buildCompany({ active: false }));

  assert.equal(await repository.findByRegistrationCodeHash('hash-1'), null);
});

test('findByRegistrationCodeHash devuelve null si el registro está deshabilitado', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteCompanyRepository(client);
  await repository.create(buildCompany({ registrationEnabled: false }));

  assert.equal(await repository.findByRegistrationCodeHash('hash-1'), null);
});

test('findByRegistrationCodeHash devuelve null si no existe ningún hash igual', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteCompanyRepository(client);
  await repository.create(buildCompany());

  assert.equal(await repository.findByRegistrationCodeHash('otro-hash'), null);
});

test('el índice único rechaza dos empresas con el mismo registration_code_hash', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteCompanyRepository(client);
  await repository.create(buildCompany());

  await assert.rejects(() => repository.create(buildCompany({ id: 'company-2', name: 'Otra' })));
});

test('update persiste los cambios', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteCompanyRepository(client);
  await repository.create(buildCompany());

  const updated = buildCompany({ active: false, registrationEnabled: false, registrationCodeHash: 'hash-2' });
  await repository.update(updated);

  assert.deepEqual(await repository.findById('company-1'), updated);
});
