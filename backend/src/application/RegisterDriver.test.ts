import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { verifyPassword } from '../domain/passwordHashing.js';
import type { AuthTokenPayload, TokenService } from '../domain/TokenService.js';
import type { User } from '../domain/User.js';
import { UserRole } from '../domain/UserRole.js';
import type { UserRepository } from '../domain/UserRepository.js';
import { RegisterDriver, type RegisterDriverInput } from './RegisterDriver.js';

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

  constructor(private readonly verifyResult: AuthTokenPayload | null) {}

  sign(payload: AuthTokenPayload): string {
    this.lastSignedPayload = payload;
    return 'fake-session-token';
  }

  verify(): AuthTokenPayload | null {
    return this.verifyResult;
  }
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

const VALID_REGISTRATION_PAYLOAD: AuthTokenPayload = { purpose: 'driver-registration', companyId: 'company-1' };

const VALID_INPUT: RegisterDriverInput = {
  username: 'nuevo-chofer',
  password: 'password123',
  passwordConfirmation: 'password123',
  registrationToken: 'fake-registration-token',
};

function buildUseCase(options: {
  userRepository?: StubUserRepository;
  companies?: Map<string, Company>;
  tokenPayload?: AuthTokenPayload | null;
}) {
  const userRepository = options.userRepository ?? new StubUserRepository();
  const companyRepository = new StubCompanyRepository(options.companies ?? new Map([[ACTIVE_COMPANY.id, ACTIVE_COMPANY]]));
  const tokenService = new StubTokenService(
    options.tokenPayload === undefined ? VALID_REGISTRATION_PAYLOAD : options.tokenPayload,
  );
  return { useCase: new RegisterDriver(userRepository, companyRepository, tokenService), userRepository, tokenService };
}

test('registra un chofer y devuelve token+user para auto-login', async () => {
  const { useCase, userRepository } = buildUseCase({});

  const result = await useCase.execute(VALID_INPUT);

  assert.equal(result.success, true);
  if (!result.success) throw new Error('esperaba éxito');
  assert.equal(result.token, 'fake-session-token');
  assert.equal(result.user.name, 'nuevo-chofer');
  assert.equal(result.user.role, UserRole.Driver);
  assert.equal(result.user.companyId, 'company-1');
  assert.equal(result.user.active, true);
  assert.equal(result.companyName, 'Acme');
  assert.equal(userRepository.created?.id, result.user.id);
});

test('el usuario creado nunca guarda la contraseña en texto plano', async () => {
  const { useCase, userRepository } = buildUseCase({});

  await useCase.execute(VALID_INPUT);

  assert.notEqual(userRepository.created?.passwordHash, VALID_INPUT.password);
  assert.equal(verifyPassword(VALID_INPUT.password, userRepository.created?.passwordHash ?? ''), true);
});

test('el rol/companyId/active del usuario creado no pueden venir del cliente', async () => {
  const { useCase, userRepository } = buildUseCase({});
  // Ni siquiera si alguien intenta colar campos extra por fuera del tipo — RegisterDriverInput no
  // los declara, así que `execute` nunca los lee.
  const tampered = { ...VALID_INPUT, role: UserRole.SuperAdmin, companyId: 'otra-empresa', active: false } as RegisterDriverInput;

  await useCase.execute(tampered);

  assert.equal(userRepository.created?.role, UserRole.Driver);
  assert.equal(userRepository.created?.companyId, 'company-1');
  assert.equal(userRepository.created?.active, true);
});

test('token de registro inválido o inexistente', async () => {
  const { useCase } = buildUseCase({ tokenPayload: null });

  const result = await useCase.execute(VALID_INPUT);

  assert.deepEqual(result, { success: false, reason: 'invalid-registration-token' });
});

test('token de sesión no puede usarse como token de registro', async () => {
  const { useCase } = buildUseCase({
    tokenPayload: { purpose: 'session', userId: 'user-1', role: UserRole.Driver, companyId: 'company-1' },
  });

  const result = await useCase.execute(VALID_INPUT);

  assert.deepEqual(result, { success: false, reason: 'invalid-registration-token' });
});

test('la empresa del token ya no existe', async () => {
  const { useCase } = buildUseCase({ companies: new Map() });

  const result = await useCase.execute(VALID_INPUT);

  assert.deepEqual(result, { success: false, reason: 'company-unavailable' });
});

test('la empresa del token fue desactivada entre el paso 1 y el paso 2', async () => {
  const { useCase } = buildUseCase({ companies: new Map([[ACTIVE_COMPANY.id, { ...ACTIVE_COMPANY, active: false }]]) });

  const result = await useCase.execute(VALID_INPUT);

  assert.deepEqual(result, { success: false, reason: 'company-unavailable' });
});

test('el registro fue deshabilitado entre el paso 1 y el paso 2', async () => {
  const { useCase } = buildUseCase({
    companies: new Map([[ACTIVE_COMPANY.id, { ...ACTIVE_COMPANY, registrationEnabled: false }]]),
  });

  const result = await useCase.execute(VALID_INPUT);

  assert.deepEqual(result, { success: false, reason: 'company-unavailable' });
});

test('las contraseñas no coinciden', async () => {
  const { useCase } = buildUseCase({});

  const result = await useCase.execute({ ...VALID_INPUT, passwordConfirmation: 'otra-contraseña' });

  assert.deepEqual(result, { success: false, reason: 'password-mismatch' });
});

test('contraseña más corta que el mínimo', async () => {
  const { useCase } = buildUseCase({});

  const result = await useCase.execute({ ...VALID_INPUT, password: 'corta', passwordConfirmation: 'corta' });

  assert.deepEqual(result, { success: false, reason: 'weak-password' });
});

test('username ya existente (comparación normalizada)', async () => {
  const existingUser: User = {
    id: 'user-existente',
    name: 'nuevo-chofer',
    role: UserRole.Driver,
    companyId: 'company-1',
    passwordHash: 'hash',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const userRepository = new StubUserRepository(new Map([['nuevo-chofer', existingUser]]));
  const { useCase } = buildUseCase({ userRepository });

  const result = await useCase.execute({ ...VALID_INPUT, username: '  Nuevo-Chofer  ' });

  assert.deepEqual(result, { success: false, reason: 'username-taken' });
});
