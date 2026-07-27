import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RouteSession } from '../types';
import { loadRouteSessionForUser } from './loadRouteSessionForUser';

const REMOTE_SESSION: RouteSession = {
  id: 'session-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deliveries: [],
};

test('usuario con ruta guardada en el backend: devuelve exactamente esa sesión', async () => {
  const session = await loadRouteSessionForUser({ fetchRouteSession: async () => REMOTE_SESSION });

  assert.equal(session, REMOTE_SESSION);
});

test('usuario nuevo sin RouteSession en el backend: inicia con una ruta vacía', async () => {
  const session = await loadRouteSessionForUser({ fetchRouteSession: async () => null });

  assert.deepEqual(session.deliveries, []);
});

test('si la carga falla (error de red), degrada a una ruta vacía en vez de romper', async () => {
  const session = await loadRouteSessionForUser({
    fetchRouteSession: async () => {
      throw new Error('network error');
    },
  });

  assert.deepEqual(session.deliveries, []);
});
