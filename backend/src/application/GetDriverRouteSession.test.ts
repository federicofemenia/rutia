import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import type { User } from '../domain/User.js';
import { UserRole } from '../domain/UserRole.js';
import type { UserRepository } from '../domain/UserRepository.js';
import { GetDriverRouteSession } from './GetDriverRouteSession.js';

class StubUserRepository implements UserRepository {
  constructor(private readonly users: User[]) {}

  async findByName(): Promise<User | null> {
    throw new Error('no usado en este test');
  }

  async findById(): Promise<User | null> {
    throw new Error('no usado en este test');
  }

  async create(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async findDriverById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id && user.role === UserRole.Driver) ?? null;
  }

  async findDriverByIdAndCompany(id: string, companyId: string): Promise<User | null> {
    return (
      this.users.find((user) => user.id === id && user.companyId === companyId && user.role === UserRole.Driver) ??
      null
    );
  }

  async listDriversByCompany(): Promise<User[]> {
    throw new Error('no usado en este test');
  }
}

class StubRouteSessionRepository implements RouteSessionRepository {
  constructor(private readonly sessionsByUserId: Map<string, RouteSession>) {}

  async findByUserId(userId: string): Promise<RouteSession | null> {
    return this.sessionsByUserId.get(userId) ?? null;
  }

  async save(): Promise<void> {
    throw new Error('no usado en este test');
  }
}

function buildDriver(overrides: Partial<User> = {}): User {
  return {
    id: 'driver-1',
    name: 'chofer',
    role: UserRole.Driver,
    companyId: 'company-1',
    passwordHash: 'hash',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const SESSION: RouteSession = {
  id: 'session-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deliveries: [],
};

test('COMPANY_ADMIN puede ver la ruta de un chofer de su propia empresa', async () => {
  const driver = buildDriver();
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map([[driver.id, SESSION]]));
  const useCase = new GetDriverRouteSession(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, requesterCompanyId: 'company-1' });

  assert.deepEqual(result, {
    driver: { id: driver.id, name: driver.name, role: driver.role },
    session: SESSION,
  });
});

test('COMPANY_ADMIN no puede ver un driverId real pero de otra empresa', async () => {
  const driver = buildDriver({ companyId: 'company-2' });
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map([[driver.id, SESSION]]));
  const useCase = new GetDriverRouteSession(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, requesterCompanyId: 'company-1' });

  assert.equal(result, null);
});

test('un driverId que existe pero no es DRIVER no aparece aunque el id sea correcto', async () => {
  const admin = buildDriver({ role: UserRole.CompanyAdmin });
  const userRepository = new StubUserRepository([admin]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map());
  const useCase = new GetDriverRouteSession(userRepository, routeSessionRepository);

  assert.equal(await useCase.execute({ driverId: admin.id, requesterCompanyId: 'company-1' }), null);
  assert.equal(await useCase.execute({ driverId: admin.id, requesterCompanyId: null }), null);
});

test('SUPER_ADMIN puede ver la ruta de cualquier chofer, sin scoping por empresa', async () => {
  const driver = buildDriver({ companyId: 'company-2' });
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map([[driver.id, SESSION]]));
  const useCase = new GetDriverRouteSession(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, requesterCompanyId: null });

  assert.deepEqual(result, {
    driver: { id: driver.id, name: driver.name, role: driver.role },
    session: SESSION,
  });
});

test('devuelve null si el driverId no existe', async () => {
  const userRepository = new StubUserRepository([]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map());
  const useCase = new GetDriverRouteSession(userRepository, routeSessionRepository);

  assert.equal(await useCase.execute({ driverId: 'id-inexistente', requesterCompanyId: 'company-1' }), null);
});

test('devuelve session null si el chofer todavía no tiene una ruta guardada', async () => {
  const driver = buildDriver();
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map());
  const useCase = new GetDriverRouteSession(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, requesterCompanyId: 'company-1' });

  assert.deepEqual(result, { driver: { id: driver.id, name: driver.name, role: driver.role }, session: null });
});
