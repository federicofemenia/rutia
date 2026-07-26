import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { hashPassword } from '../domain/passwordHashing.js';
import type { AuthTokenPayload, TokenService } from '../domain/TokenService.js';
import type { User } from '../domain/User.js';
import { UserRole } from '../domain/UserRole.js';
import type { UserRepository } from '../domain/UserRepository.js';
import { AuthenticateUser } from './AuthenticateUser.js';

class StubUserRepository implements UserRepository {
  constructor(private readonly usersByName: Map<string, User>) {}

  async findByName(name: string): Promise<User | null> {
    return this.usersByName.get(name.toLowerCase()) ?? null;
  }

  async findById(): Promise<User | null> {
    throw new Error('no usado en este test');
  }

  async create(): Promise<void> {
    throw new Error('no usado en este test');
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

class StubTokenService implements TokenService {
  public lastSignedPayload: AuthTokenPayload | undefined;

  sign(payload: AuthTokenPayload): string {
    this.lastSignedPayload = payload;
    return 'fake-token';
  }

  verify(): AuthTokenPayload | null {
    throw new Error('no usado en este test');
  }
}

const PASSWORD = 'password123';

function buildDriver(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'chofer',
    role: UserRole.Driver,
    companyId: 'company-1',
    passwordHash: hashPassword(PASSWORD),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const ACTIVE_COMPANY: Company = {
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

test('autentica y firma un token de sesión cuando el usuario y su empresa están activos', async () => {
  const driver = buildDriver();
  const userRepository = new StubUserRepository(new Map([[driver.name, driver]]));
  const companyRepository = new StubCompanyRepository(new Map([[ACTIVE_COMPANY.id, ACTIVE_COMPANY]]));
  const tokenService = new StubTokenService();
  const useCase = new AuthenticateUser(userRepository, companyRepository, tokenService);

  const result = await useCase.execute({ name: driver.name, password: PASSWORD });

  assert.deepEqual(result, { user: driver, companyName: 'Acme', token: 'fake-token' });
  assert.deepEqual(tokenService.lastSignedPayload, {
    purpose: 'session',
    userId: driver.id,
    role: driver.role,
    companyId: driver.companyId,
  });
});

test('autentica un super admin sin empresa (companyId null) sin consultar CompanyRepository', async () => {
  const superAdmin = buildDriver({ role: UserRole.SuperAdmin, companyId: null });
  const userRepository = new StubUserRepository(new Map([[superAdmin.name, superAdmin]]));
  const companyRepository = new StubCompanyRepository(new Map());
  const tokenService = new StubTokenService();
  const useCase = new AuthenticateUser(userRepository, companyRepository, tokenService);

  const result = await useCase.execute({ name: superAdmin.name, password: PASSWORD });

  assert.deepEqual(result, { user: superAdmin, companyName: null, token: 'fake-token' });
});

test('devuelve null si el usuario no existe', async () => {
  const userRepository = new StubUserRepository(new Map());
  const companyRepository = new StubCompanyRepository(new Map());
  const useCase = new AuthenticateUser(userRepository, companyRepository, new StubTokenService());

  assert.equal(await useCase.execute({ name: 'nadie', password: PASSWORD }), null);
});

test('devuelve null si la contraseña es incorrecta', async () => {
  const driver = buildDriver();
  const userRepository = new StubUserRepository(new Map([[driver.name, driver]]));
  const companyRepository = new StubCompanyRepository(new Map([[ACTIVE_COMPANY.id, ACTIVE_COMPANY]]));
  const useCase = new AuthenticateUser(userRepository, companyRepository, new StubTokenService());

  assert.equal(await useCase.execute({ name: driver.name, password: 'contraseña-incorrecta' }), null);
});

test('devuelve null si el usuario está inactivo', async () => {
  const driver = buildDriver({ active: false });
  const userRepository = new StubUserRepository(new Map([[driver.name, driver]]));
  const companyRepository = new StubCompanyRepository(new Map([[ACTIVE_COMPANY.id, ACTIVE_COMPANY]]));
  const useCase = new AuthenticateUser(userRepository, companyRepository, new StubTokenService());

  assert.equal(await useCase.execute({ name: driver.name, password: PASSWORD }), null);
});

test('devuelve null si la empresa del usuario está inactiva', async () => {
  const driver = buildDriver();
  const userRepository = new StubUserRepository(new Map([[driver.name, driver]]));
  const companyRepository = new StubCompanyRepository(new Map([[ACTIVE_COMPANY.id, { ...ACTIVE_COMPANY, active: false }]]));
  const useCase = new AuthenticateUser(userRepository, companyRepository, new StubTokenService());

  assert.equal(await useCase.execute({ name: driver.name, password: PASSWORD }), null);
});

test('devuelve null si la empresa del usuario no existe', async () => {
  const driver = buildDriver({ companyId: 'empresa-inexistente' });
  const userRepository = new StubUserRepository(new Map([[driver.name, driver]]));
  const companyRepository = new StubCompanyRepository(new Map());
  const useCase = new AuthenticateUser(userRepository, companyRepository, new StubTokenService());

  assert.equal(await useCase.execute({ name: driver.name, password: PASSWORD }), null);
});
