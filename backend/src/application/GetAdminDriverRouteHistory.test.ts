import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionHistoryEntry } from '../domain/RouteSessionHistoryEntry.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import { RouteSessionStatus } from '../domain/RouteSessionStatus.js';
import type { User } from '../domain/User.js';
import { UserRole } from '../domain/UserRole.js';
import type { UserRepository } from '../domain/UserRepository.js';
import { GetAdminDriverRouteHistory } from './GetAdminDriverRouteHistory.js';

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
  constructor(private readonly historyByUserId: Map<string, RouteSessionHistoryEntry[]>) {}

  async findByUserId(): Promise<RouteSession | null> {
    throw new Error('no usado en este test');
  }

  async save(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async archiveFinishedSession(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async findHistoryByUserId(userId: string): Promise<RouteSessionHistoryEntry[]> {
    return this.historyByUserId.get(userId) ?? [];
  }

  async findHistoryEntryById(): Promise<null> {
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

function buildSession(statuses: DeliveryStatus[]): RouteSession {
  return {
    id: 'session-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    status: RouteSessionStatus.Finished,
    deliveries: statuses.map((status, index) => ({
      id: `delivery-${index}`,
      address: { street: '', locality: '', province: '', country: 'Argentina' },
      createdAt: '2026-01-01T00:00:00.000Z',
      geocodingStatus: 'verified',
      status,
    })),
  };
}

test('COMPANY_ADMIN puede ver el historico de un chofer de su propia empresa', async () => {
  const driver = buildDriver();
  const entry: RouteSessionHistoryEntry = {
    id: 'history-1',
    finishedAt: '2026-01-05T00:00:00.000Z',
    session: buildSession([DeliveryStatus.Delivered, DeliveryStatus.Failed]),
  };
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map([[driver.id, [entry]]]));
  const useCase = new GetAdminDriverRouteHistory(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, requesterCompanyId: 'company-1' });

  assert.deepEqual(result, {
    driver: { id: driver.id, name: driver.name, role: driver.role },
    history: [{ id: 'history-1', finishedAt: '2026-01-05T00:00:00.000Z', totalDeliveries: 2, deliveredCount: 1, failedCount: 1 }],
  });
});

test('COMPANY_ADMIN no puede ver el historico de un chofer de otra empresa', async () => {
  const driver = buildDriver({ companyId: 'company-2' });
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map());
  const useCase = new GetAdminDriverRouteHistory(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, requesterCompanyId: 'company-1' });

  assert.equal(result, null);
});

test('SUPER_ADMIN puede ver el historico de cualquier chofer, sin scoping por empresa', async () => {
  const driver = buildDriver({ companyId: 'company-2' });
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map());
  const useCase = new GetAdminDriverRouteHistory(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, requesterCompanyId: null });

  assert.deepEqual(result, { driver: { id: driver.id, name: driver.name, role: driver.role }, history: [] });
});

test('devuelve null si el driverId no existe', async () => {
  const userRepository = new StubUserRepository([]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map());
  const useCase = new GetAdminDriverRouteHistory(userRepository, routeSessionRepository);

  assert.equal(await useCase.execute({ driverId: 'id-inexistente', requesterCompanyId: 'company-1' }), null);
});

test('devuelve historial vacio si el chofer todavia no termino ninguna ruta', async () => {
  const driver = buildDriver();
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(new Map());
  const useCase = new GetAdminDriverRouteHistory(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, requesterCompanyId: 'company-1' });

  assert.deepEqual(result, { driver: { id: driver.id, name: driver.name, role: driver.role }, history: [] });
});
