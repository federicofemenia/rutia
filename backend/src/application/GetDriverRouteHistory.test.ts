import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionHistoryEntry } from '../domain/RouteSessionHistoryEntry.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import { RouteSessionStatus } from '../domain/RouteSessionStatus.js';
import { GetDriverRouteHistory } from './GetDriverRouteHistory.js';

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

test('devuelve una lista vacía si el usuario no tiene histórico', async () => {
  const useCase = new GetDriverRouteHistory(new StubRouteSessionRepository(new Map()));

  assert.deepEqual(await useCase.execute('user-1'), []);
});

test('calcula totalDeliveries/deliveredCount/failedCount a partir de las entregas de cada sesión', async () => {
  const session = buildSession([
    DeliveryStatus.Delivered,
    DeliveryStatus.Delivered,
    DeliveryStatus.Failed,
    DeliveryStatus.Pending,
  ]);
  const entry: RouteSessionHistoryEntry = { id: 'history-1', finishedAt: '2026-01-05T00:00:00.000Z', session };
  const useCase = new GetDriverRouteHistory(new StubRouteSessionRepository(new Map([['user-1', [entry]]])));

  const result = await useCase.execute('user-1');

  assert.deepEqual(result, [
    { id: 'history-1', finishedAt: '2026-01-05T00:00:00.000Z', totalDeliveries: 4, deliveredCount: 2, failedCount: 1 },
  ]);
});

test('nunca incluye el session_json completo ni datos de otro usuario', async () => {
  const ownEntry: RouteSessionHistoryEntry = {
    id: 'history-own',
    finishedAt: '2026-01-01T00:00:00.000Z',
    session: buildSession([DeliveryStatus.Delivered]),
  };
  const otherEntry: RouteSessionHistoryEntry = {
    id: 'history-other',
    finishedAt: '2026-01-01T00:00:00.000Z',
    session: buildSession([DeliveryStatus.Failed]),
  };
  const useCase = new GetDriverRouteHistory(
    new StubRouteSessionRepository(
      new Map([
        ['user-1', [ownEntry]],
        ['user-2', [otherEntry]],
      ]),
    ),
  );

  const result = await useCase.execute('user-1');

  assert.deepEqual(
    result.map((summary) => summary.id),
    ['history-own'],
  );
  assert.deepEqual(Object.keys(result[0] ?? {}).sort(), [
    'deliveredCount',
    'failedCount',
    'finishedAt',
    'id',
    'totalDeliveries',
  ]);
});
