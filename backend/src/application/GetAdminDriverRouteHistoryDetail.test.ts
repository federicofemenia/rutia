import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionHistoryEntry } from '../domain/RouteSessionHistoryEntry.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import { RouteSessionStatus } from '../domain/RouteSessionStatus.js';
import type { User } from '../domain/User.js';
import { UserRole } from '../domain/UserRole.js';
import type { UserRepository } from '../domain/UserRepository.js';
import { GetAdminDriverRouteHistoryDetail } from './GetAdminDriverRouteHistoryDetail.js';

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
  public requestedId: string | undefined;
  public requestedUserId: string | undefined;

  constructor(private readonly entry: RouteSessionHistoryEntry | null) {}

  async findByUserId(): Promise<RouteSession | null> {
    throw new Error('no usado en este test');
  }

  async save(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async archiveFinishedSession(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async findHistoryByUserId(): Promise<never[]> {
    throw new Error('no usado en este test');
  }

  async findHistoryEntryById(id: string, userId: string): Promise<RouteSessionHistoryEntry | null> {
    this.requestedId = id;
    this.requestedUserId = userId;
    return this.entry;
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
  status: RouteSessionStatus.Finished,
  deliveries: [],
};

test('COMPANY_ADMIN puede ver el detalle de un chofer de su propia empresa, scopeado por el userId real del chofer', async () => {
  const driver = buildDriver();
  const entry: RouteSessionHistoryEntry = { id: 'history-1', finishedAt: '2026-01-01T00:00:00.000Z', session: SESSION };
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(entry);
  const useCase = new GetAdminDriverRouteHistoryDetail(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, entryId: 'history-1', requesterCompanyId: 'company-1' });

  assert.deepEqual(result, entry);
  assert.equal(routeSessionRepository.requestedId, 'history-1');
  assert.equal(routeSessionRepository.requestedUserId, driver.id);
});

test('COMPANY_ADMIN no puede ver el detalle de un chofer de otra empresa', async () => {
  const driver = buildDriver({ companyId: 'company-2' });
  const entry: RouteSessionHistoryEntry = { id: 'history-1', finishedAt: '2026-01-01T00:00:00.000Z', session: SESSION };
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(entry);
  const useCase = new GetAdminDriverRouteHistoryDetail(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, entryId: 'history-1', requesterCompanyId: 'company-1' });

  assert.equal(result, null);
});

test('SUPER_ADMIN puede ver el detalle de cualquier chofer', async () => {
  const driver = buildDriver({ companyId: 'company-2' });
  const entry: RouteSessionHistoryEntry = { id: 'history-1', finishedAt: '2026-01-01T00:00:00.000Z', session: SESSION };
  const userRepository = new StubUserRepository([driver]);
  const routeSessionRepository = new StubRouteSessionRepository(entry);
  const useCase = new GetAdminDriverRouteHistoryDetail(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: driver.id, entryId: 'history-1', requesterCompanyId: null });

  assert.deepEqual(result, entry);
});

test('devuelve null si el driverId no existe', async () => {
  const userRepository = new StubUserRepository([]);
  const routeSessionRepository = new StubRouteSessionRepository(null);
  const useCase = new GetAdminDriverRouteHistoryDetail(userRepository, routeSessionRepository);

  const result = await useCase.execute({ driverId: 'id-inexistente', entryId: 'history-1', requesterCompanyId: 'company-1' });

  assert.equal(result, null);
});
