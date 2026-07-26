import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient, type Client } from '@libsql/client';
import { runMigrations } from '../database/runMigrations.js';
import { migrations } from '../database/migrations/migrations.js';
import type { Company } from '../../domain/Company.js';
import { UserRole } from '../../domain/UserRole.js';
import type { User } from '../../domain/User.js';
import { SqliteCompanyRepository } from './SqliteCompanyRepository.js';
import { SqliteUserRepository } from './SqliteUserRepository.js';

function buildCompany(id: string): Company {
  return {
    id,
    name: id,
    legalName: null,
    taxId: null,
    contactEmail: null,
    registrationCodeHash: `hash-${id}`,
    registrationEnabled: true,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/** `users.company_id` tiene FOREIGN KEY a `companies(id)`, y libSQL sí la exige — se insertan las
 * empresas de referencia (`company-1`, `company-2`) antes de crear usuarios que las usan. */
async function createMigratedClient(): Promise<Client> {
  const client = createClient({ url: ':memory:' });
  await runMigrations(client, migrations);
  const companyRepository = new SqliteCompanyRepository(client);
  await companyRepository.create(buildCompany('company-1'));
  await companyRepository.create(buildCompany('company-2'));
  return client;
}

const SAMPLE_USER: User = {
  id: 'user-1',
  name: 'chofer',
  role: UserRole.Driver,
  companyId: 'company-1',
  passwordHash: 'hashed-password',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

test('create + findById devuelve el usuario creado', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);

  await repository.create(SAMPLE_USER);
  const found = await repository.findById(SAMPLE_USER.id);

  assert.deepEqual(found, SAMPLE_USER);
});

test('findByName no distingue mayúsculas/minúsculas', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);
  await repository.create(SAMPLE_USER);

  const found = await repository.findByName('CHOFER');

  assert.deepEqual(found, SAMPLE_USER);
});

test('findByName y findById devuelven null si no existe', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);

  assert.equal(await repository.findByName('nadie'), null);
  assert.equal(await repository.findById('id-inexistente'), null);
});

test('create de un company_admin conserva el rol correcto', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);
  const admin: User = { ...SAMPLE_USER, id: 'user-2', name: 'admin', role: UserRole.CompanyAdmin };

  await repository.create(admin);
  const found = await repository.findById(admin.id);

  assert.equal(found?.role, UserRole.CompanyAdmin);
});

test('create de un super_admin conserva companyId null', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);
  const superAdmin: User = { ...SAMPLE_USER, id: 'user-3', name: 'root', role: UserRole.SuperAdmin, companyId: null };

  await repository.create(superAdmin);
  const found = await repository.findById(superAdmin.id);

  assert.deepEqual(found, superAdmin);
});

test('create respeta active: false', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);
  const inactive: User = { ...SAMPLE_USER, id: 'user-4', name: 'inactivo', active: false };

  await repository.create(inactive);
  const found = await repository.findById(inactive.id);

  assert.equal(found?.active, false);
});

test('findDriverById devuelve el usuario solo si su rol es DRIVER', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);
  const admin: User = { ...SAMPLE_USER, id: 'user-2', name: 'admin', role: UserRole.CompanyAdmin };
  await repository.create(SAMPLE_USER);
  await repository.create(admin);

  assert.deepEqual(await repository.findDriverById(SAMPLE_USER.id), SAMPLE_USER);
  assert.equal(await repository.findDriverById(admin.id), null);
  assert.equal(await repository.findDriverById('id-inexistente'), null);
});

test('findDriverByIdAndCompany exige coincidencia de empresa y rol DRIVER', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);
  await repository.create(SAMPLE_USER);

  assert.deepEqual(await repository.findDriverByIdAndCompany(SAMPLE_USER.id, 'company-1'), SAMPLE_USER);
  assert.equal(await repository.findDriverByIdAndCompany(SAMPLE_USER.id, 'otra-empresa'), null);
});

test('listDriversByCompany solo devuelve choferes activos de esa empresa', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);
  const otherDriver: User = { ...SAMPLE_USER, id: 'user-2', name: 'otro-chofer' };
  const otherCompanyDriver: User = { ...SAMPLE_USER, id: 'user-3', name: 'chofer-b', companyId: 'company-2' };
  const admin: User = { ...SAMPLE_USER, id: 'user-4', name: 'admin', role: UserRole.CompanyAdmin };
  await repository.create(SAMPLE_USER);
  await repository.create(otherDriver);
  await repository.create(otherCompanyDriver);
  await repository.create(admin);

  const drivers = await repository.listDriversByCompany('company-1');

  assert.deepEqual(
    drivers.map((driver) => driver.id).sort(),
    [SAMPLE_USER.id, otherDriver.id].sort(),
  );
});
