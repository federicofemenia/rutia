import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import { RouteSessionStatus } from '../domain/RouteSessionStatus.js';
import type { User } from '../domain/User.js';
import { UserRole } from '../domain/UserRole.js';
import type { UserRepository } from '../domain/UserRepository.js';
import { GetCompanyDrivers } from './GetCompanyDrivers.js';

class StubUserRepository implements UserRepository {
  constructor(private readonly driversByCompany: Map<string, User[]>) {}

  async findByName(): Promise<User | null> {
    throw new Error('no usado en este test');
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

  async listDriversByCompany(companyId: string): Promise<User[]> {
    return this.driversByCompany.get(companyId) ?? [];
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

  async archiveFinishedSession(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async findHistoryByUserId(): Promise<never[]> {
    throw new Error('no usado en este test');
  }

  async findHistoryEntryById(): Promise<null> {
    throw new Error('no usado en este test');
  }
}

function buildDriver(id: string, companyId: string): User {
  return {
    id,
    name: `chofer-${id}`,
    role: UserRole.Driver,
    companyId,
    passwordHash: 'hash',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function buildSession(statuses: DeliveryStatus[]): RouteSession {
  return {
    id: 'session-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    status: RouteSessionStatus.InProgress,
    deliveries: statuses.map((status, index) => ({
      id: `delivery-${index}`,
      address: { street: '', locality: '', province: '', country: 'Argentina' },
      createdAt: '2026-01-01T00:00:00.000Z',
      geocodingStatus: 'verified',
      status,
    })),
  };
}

test('delega en listDriversByCompany con el companyId recibido', async () => {
  const drivers = [buildDriver('driver-1', 'company-1'), buildDriver('driver-2', 'company-1')];
  const useCase = new GetCompanyDrivers(
    new StubUserRepository(new Map([['company-1', drivers]])),
    new StubRouteSessionRepository(new Map()),
  );

  const result = await useCase.execute('company-1');

  assert.deepEqual(
    result.map((r) => r.driver.id),
    ['driver-1', 'driver-2'],
  );
});

test('devuelve una lista vacía si la empresa no tiene choferes', async () => {
  const useCase = new GetCompanyDrivers(new StubUserRepository(new Map()), new StubRouteSessionRepository(new Map()));

  assert.deepEqual(await useCase.execute('company-sin-choferes'), []);
});

test('hasActiveRoute es true si el chofer tiene entregas pending o inProgress', async () => {
  const driver = buildDriver('driver-1', 'company-1');
  const useCase = new GetCompanyDrivers(
    new StubUserRepository(new Map([['company-1', [driver]]])),
    new StubRouteSessionRepository(new Map([[driver.id, buildSession([DeliveryStatus.Pending])]])),
  );

  const [result] = await useCase.execute('company-1');

  assert.equal(result.hasActiveRoute, true);
});

test('hasActiveRoute es false si todas las entregas están resueltas', async () => {
  const driver = buildDriver('driver-1', 'company-1');
  const useCase = new GetCompanyDrivers(
    new StubUserRepository(new Map([['company-1', [driver]]])),
    new StubRouteSessionRepository(
      new Map([[driver.id, buildSession([DeliveryStatus.Delivered, DeliveryStatus.Failed])]]),
    ),
  );

  const [result] = await useCase.execute('company-1');

  assert.equal(result.hasActiveRoute, false);
});

test('hasActiveRoute es false si el chofer no tiene ninguna sesión guardada', async () => {
  const driver = buildDriver('driver-1', 'company-1');
  const useCase = new GetCompanyDrivers(
    new StubUserRepository(new Map([['company-1', [driver]]])),
    new StubRouteSessionRepository(new Map()),
  );

  const [result] = await useCase.execute('company-1');

  assert.equal(result.hasActiveRoute, false);
});
