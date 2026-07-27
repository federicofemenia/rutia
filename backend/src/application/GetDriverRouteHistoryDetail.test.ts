import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionHistoryEntry } from '../domain/RouteSessionHistoryEntry.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import { RouteSessionStatus } from '../domain/RouteSessionStatus.js';
import { GetDriverRouteHistoryDetail } from './GetDriverRouteHistoryDetail.js';

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

const SESSION: RouteSession = {
  id: 'session-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  status: RouteSessionStatus.Finished,
  deliveries: [],
};

test('devuelve la entrada cuando el repositorio la encuentra', async () => {
  const entry: RouteSessionHistoryEntry = { id: 'history-1', finishedAt: '2026-01-01T00:00:00.000Z', session: SESSION };
  const repository = new StubRouteSessionRepository(entry);
  const useCase = new GetDriverRouteHistoryDetail(repository);

  const result = await useCase.execute('history-1', 'user-1');

  assert.deepEqual(result, entry);
  assert.equal(repository.requestedId, 'history-1');
  assert.equal(repository.requestedUserId, 'user-1');
});

test('devuelve null si el repositorio no encuentra la entrada para ese id + userId', async () => {
  const repository = new StubRouteSessionRepository(null);
  const useCase = new GetDriverRouteHistoryDetail(repository);

  assert.equal(await useCase.execute('history-de-otro', 'user-1'), null);
});
