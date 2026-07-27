import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import { RouteSessionStatus } from '../domain/RouteSessionStatus.js';
import { FinishRouteSession } from './FinishRouteSession.js';

class StubRouteSessionRepository implements RouteSessionRepository {
  public saved: RouteSession | undefined;
  public archived: RouteSession | undefined;

  constructor(private session: RouteSession | null) {}

  async findByUserId(): Promise<RouteSession | null> {
    return this.session;
  }

  async save(_userId: string, session: RouteSession): Promise<void> {
    this.saved = session;
  }

  async archiveFinishedSession(_userId: string, session: RouteSession): Promise<void> {
    this.archived = session;
  }
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

test('finaliza la ruta, la guarda como finished y la archiva', async () => {
  const session = buildSession([DeliveryStatus.Delivered, DeliveryStatus.Failed]);
  const repository = new StubRouteSessionRepository(session);
  const useCase = new FinishRouteSession(repository);

  const result = await useCase.execute('user-1');

  assert.equal(result.success, true);
  if (!result.success) throw new Error('esperaba éxito');
  assert.equal(result.session.status, RouteSessionStatus.Finished);
  assert.deepEqual(repository.saved, result.session);
  assert.deepEqual(repository.archived, result.session);
});

test('devuelve no-active-route si el usuario no tiene ninguna sesión guardada', async () => {
  const repository = new StubRouteSessionRepository(null);
  const useCase = new FinishRouteSession(repository);

  const result = await useCase.execute('user-1');

  assert.deepEqual(result, { success: false, reason: 'no-active-route' });
});

test('devuelve deliveries-still-pending si queda alguna entrega Pending', async () => {
  const session = buildSession([DeliveryStatus.Delivered, DeliveryStatus.Pending]);
  const repository = new StubRouteSessionRepository(session);
  const useCase = new FinishRouteSession(repository);

  const result = await useCase.execute('user-1');

  assert.deepEqual(result, { success: false, reason: 'deliveries-still-pending' });
  assert.equal(repository.saved, undefined);
  assert.equal(repository.archived, undefined);
});

test('devuelve deliveries-still-pending si queda alguna entrega InProgress', async () => {
  const session = buildSession([DeliveryStatus.Delivered, DeliveryStatus.InProgress]);
  const repository = new StubRouteSessionRepository(session);
  const useCase = new FinishRouteSession(repository);

  const result = await useCase.execute('user-1');

  assert.deepEqual(result, { success: false, reason: 'deliveries-still-pending' });
});
