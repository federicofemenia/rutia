import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { verifyPassword } from '../domain/passwordHashing.js';
import type { User } from '../domain/User.js';
import { UserRole } from '../domain/UserRole.js';
import type { UserRepository } from '../domain/UserRepository.js';
import { CreateCompanyAdmin } from './CreateCompanyAdmin.js';

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
  constructor(private readonly companiesById: Map<string, Company>) {}

  async create(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async update(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async findById(id: string): Promise<Company | null> {
    return this.companiesById.get(id) ?? null;
  }

  async findByRegistrationCodeHash(): Promise<Company | null> {
    throw new Error('no usado en este test');
  }
}

class StubUserRepository implements UserRepository {
  public created: User | undefined;

  constructor(private readonly existingUsersByName: Map<string, User> = new Map()) {}

  async findByName(name: string): Promise<User | null> {
    return this.existingUsersByName.get(name) ?? null;
  }

  async findById(): Promise<User | null> {
    throw new Error('no usado en este test');
  }

  async create(user: User): Promise<void> {
    this.created = user;
  }

  async findDriverById(): Promise<User | null> {
    throw new Error('no usado en este test');
  }

  async findDriverByIdAndCompany(): Promise<User | null> {
    throw new Error('no usado en este test');
  }

  async listDriversByCompany(): Promise<User[]> {
    throw new Error('no usado en este test');
  }
}

const VALID_INPUT = { companyId: 'company-1', username: 'admin-acme', password: 'password123' };

test('crea un company_admin activo para la empresa indicada', async () => {
  const userRepository = new StubUserRepository();
  const companyRepository = new StubCompanyRepository(new Map([[EXISTING_COMPANY.id, EXISTING_COMPANY]]));
  const useCase = new CreateCompanyAdmin(userRepository, companyRepository);

  const result = await useCase.execute(VALID_INPUT);

  assert.equal(result.success, true);
  if (!result.success) throw new Error('esperaba éxito');
  assert.equal(result.user.role, UserRole.CompanyAdmin);
  assert.equal(result.user.companyId, 'company-1');
  assert.equal(result.user.active, true);
  assert.equal(verifyPassword(VALID_INPUT.password, result.user.passwordHash), true);
});

test('devuelve company-not-found si la empresa no existe', async () => {
  const useCase = new CreateCompanyAdmin(new StubUserRepository(), new StubCompanyRepository(new Map()));

  const result = await useCase.execute(VALID_INPUT);

  assert.deepEqual(result, { success: false, reason: 'company-not-found' });
});

test('devuelve weak-password si la contraseña es demasiado corta', async () => {
  const companyRepository = new StubCompanyRepository(new Map([[EXISTING_COMPANY.id, EXISTING_COMPANY]]));
  const useCase = new CreateCompanyAdmin(new StubUserRepository(), companyRepository);

  const result = await useCase.execute({ ...VALID_INPUT, password: 'corta' });

  assert.deepEqual(result, { success: false, reason: 'weak-password' });
});

test('devuelve username-taken si el username ya existe (normalizado)', async () => {
  const existingUser: User = {
    id: 'user-existente',
    name: 'admin-acme',
    role: UserRole.CompanyAdmin,
    companyId: 'company-1',
    passwordHash: 'hash',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const userRepository = new StubUserRepository(new Map([['admin-acme', existingUser]]));
  const companyRepository = new StubCompanyRepository(new Map([[EXISTING_COMPANY.id, EXISTING_COMPANY]]));
  const useCase = new CreateCompanyAdmin(userRepository, companyRepository);

  const result = await useCase.execute({ ...VALID_INPUT, username: '  Admin-Acme  ' });

  assert.deepEqual(result, { success: false, reason: 'username-taken' });
});
