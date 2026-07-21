import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient, type Client } from '@libsql/client';
import { runMigrations } from '../database/runMigrations.js';
import { migrations } from '../database/migrations/migrations.js';
import type { RouteSession } from '../../domain/RouteSession.js';
import type { User } from '../../domain/User.js';
import { UserRole } from '../../domain/UserRole.js';
import { SqliteUserRepository } from './SqliteUserRepository.js';
import { SqliteRouteSessionRepository } from './SqliteRouteSessionRepository.js';

const SAMPLE_USER: User = {
  id: 'user-1',
  name: 'chofer',
  role: UserRole.Chofer,
  passwordHash: 'hashed-password',
  createdAt: '2026-01-01T00:00:00.000Z',
};

/**
 * `route_sessions.user_id` tiene FOREIGN KEY a `users(id)`, y a diferencia de `node:sqlite`
 * (que no la hacía cumplir por defecto), el cliente local de libSQL sí la exige — así que estos
 * tests, igual que el uso real (solo se guarda la sesión de un usuario ya autenticado), necesitan
 * un usuario real insertado antes de poder guardar su route_session.
 */
async function createMigratedClientWithUser(): Promise<Client> {
  const client = createClient({ url: ':memory:' });
  await runMigrations(client, migrations);
  await new SqliteUserRepository(client).create(SAMPLE_USER);
  return client;
}

const SAMPLE_SESSION: RouteSession = {
  id: 'session-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deliveries: [],
};

test('save + findByUserId devuelve la sesión guardada', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);

  await repository.save(SAMPLE_USER.id, SAMPLE_SESSION);
  const found = await repository.findByUserId(SAMPLE_USER.id);

  assert.deepEqual(found, SAMPLE_SESSION);
});

test('findByUserId devuelve null si no hay sesión guardada para ese usuario', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);

  assert.equal(await repository.findByUserId('nadie'), null);
});

test('save es un upsert: la segunda llamada actualiza en vez de duplicar', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);

  await repository.save(SAMPLE_USER.id, SAMPLE_SESSION);
  const updated: RouteSession = { ...SAMPLE_SESSION, updatedAt: '2026-01-02T00:00:00.000Z' };
  await repository.save(SAMPLE_USER.id, updated);

  const found = await repository.findByUserId(SAMPLE_USER.id);
  assert.deepEqual(found, updated);

  const countResult = await client.execute({
    sql: 'SELECT COUNT(*) as count FROM route_sessions WHERE user_id = ?',
    args: [SAMPLE_USER.id],
  });
  assert.equal(countResult.rows[0]?.count, 1);
});

test('findByUserId devuelve null (no revienta) si session_json no es JSON válido', async () => {
  const client = await createMigratedClientWithUser();
  await client.execute({
    sql: 'INSERT INTO route_sessions (user_id, session_json, updated_at) VALUES (?, ?, ?)',
    args: [SAMPLE_USER.id, '{not valid json', '2026-01-01T00:00:00.000Z'],
  });
  const repository = new SqliteRouteSessionRepository(client);

  assert.equal(await repository.findByUserId(SAMPLE_USER.id), null);
});

test('findByUserId devuelve null si session_json es JSON válido pero no tiene forma de RouteSession', async () => {
  const client = await createMigratedClientWithUser();
  await client.execute({
    sql: 'INSERT INTO route_sessions (user_id, session_json, updated_at) VALUES (?, ?, ?)',
    args: [SAMPLE_USER.id, JSON.stringify({ foo: 'bar' }), '2026-01-01T00:00:00.000Z'],
  });
  const repository = new SqliteRouteSessionRepository(client);

  assert.equal(await repository.findByUserId(SAMPLE_USER.id), null);
});
