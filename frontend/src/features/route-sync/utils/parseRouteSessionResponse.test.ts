import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRouteSessionResponse } from './parseRouteSessionResponse';

function fakeResponse(overrides: { status: number; ok: boolean; body?: unknown }): Pick<Response, 'ok' | 'status' | 'json'> {
  return {
    ok: overrides.ok,
    status: overrides.status,
    json: async () => overrides.body,
  };
}

test('una ruta existente en el backend se restaura con createdAt/updatedAt como Date', async () => {
  const response = fakeResponse({
    status: 200,
    ok: true,
    body: {
      id: 'session-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      deliveries: [],
    },
  });

  const session = await parseRouteSessionResponse(response);

  assert.ok(session);
  assert.equal(session?.id, 'session-1');
  assert.ok(session?.createdAt instanceof Date);
  assert.ok(session?.updatedAt instanceof Date);
  assert.equal(session?.createdAt.toISOString(), '2026-01-01T00:00:00.000Z');
  assert.deepEqual(session?.deliveries, []);
});

test('404 se interpreta como "sin ruta guardada" (null), no como error', async () => {
  const response = fakeResponse({ status: 404, ok: false });

  const session = await parseRouteSessionResponse(response);

  assert.equal(session, null);
});

test('cualquier otro status de error tira una excepción', async () => {
  const response = fakeResponse({ status: 500, ok: false });

  await assert.rejects(() => parseRouteSessionResponse(response));
});
