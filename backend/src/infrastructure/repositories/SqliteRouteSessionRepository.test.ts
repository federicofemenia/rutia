import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient, type Client } from '@libsql/client';
import { runMigrations } from '../database/runMigrations.js';
import { migrations } from '../database/migrations/migrations.js';
import type { Company } from '../../domain/Company.js';
import type { RouteSession } from '../../domain/RouteSession.js';
import { RouteSessionStatus } from '../../domain/RouteSessionStatus.js';
import type { User } from '../../domain/User.js';
import { UserRole } from '../../domain/UserRole.js';
import { SqliteCompanyRepository } from './SqliteCompanyRepository.js';
import { SqliteUserRepository } from './SqliteUserRepository.js';
import { SqliteRouteSessionRepository } from './SqliteRouteSessionRepository.js';

const SAMPLE_COMPANY: Company = {
  id: 'company-1',
  name: 'Acme',
  legalName: null,
  taxId: null,
  contactEmail: null,
  registrationCodeHash: 'hash-company-1',
  registrationEnabled: true,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const SAMPLE_USER: User = {
  id: 'user-1',
  name: 'chofer',
  role: UserRole.Driver,
  companyId: 'company-1',
  passwordHash: 'hashed-password',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const OTHER_USER: User = {
  ...SAMPLE_USER,
  id: 'user-2',
  name: 'otro-chofer',
};

/**
 * `route_sessions.user_id` tiene FOREIGN KEY a `users(id)` (y `users.company_id` a
 * `companies(id)`), y a diferencia de `node:sqlite` (que no la hacía cumplir por defecto), el
 * cliente local de libSQL sí la exige — así que estos tests, igual que el uso real (solo se guarda
 * la sesión de un usuario ya autenticado), necesitan una empresa y un usuario reales insertados
 * antes de poder guardar su route_session.
 */
async function createMigratedClientWithUser(): Promise<Client> {
  const client = createClient({ url: ':memory:' });
  await runMigrations(client, migrations);
  await new SqliteCompanyRepository(client).create(SAMPLE_COMPANY);
  await new SqliteUserRepository(client).create(SAMPLE_USER);
  await new SqliteUserRepository(client).create(OTHER_USER);
  return client;
}

const SAMPLE_SESSION: RouteSession = {
  id: 'session-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deliveries: [],
  status: RouteSessionStatus.InProgress,
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

test('la sesión de un usuario está completamente aislada de la de otro (mismo user_id nunca se comparte)', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);
  const otherSession: RouteSession = { ...SAMPLE_SESSION, id: 'session-2', deliveries: [] };

  await repository.save(SAMPLE_USER.id, SAMPLE_SESSION);

  // El segundo usuario nunca guardó nada — no debe heredar la sesión del primero.
  assert.equal(await repository.findByUserId(OTHER_USER.id), null);

  await repository.save(OTHER_USER.id, otherSession);

  // Ahora que ambos tienen sesión, cada `findByUserId` devuelve exclusivamente la propia.
  assert.deepEqual(await repository.findByUserId(SAMPLE_USER.id), SAMPLE_SESSION);
  assert.deepEqual(await repository.findByUserId(OTHER_USER.id), otherSession);
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

test('una sesión persistida antes de que existiera "status" se lee como in_progress (compatibilidad)', async () => {
  const client = await createMigratedClientWithUser();
  const legacySessionJson = JSON.stringify({
    id: 'session-legacy',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deliveries: [],
  });
  await client.execute({
    sql: 'INSERT INTO route_sessions (user_id, session_json, updated_at) VALUES (?, ?, ?)',
    args: [SAMPLE_USER.id, legacySessionJson, '2026-01-01T00:00:00.000Z'],
  });
  const repository = new SqliteRouteSessionRepository(client);

  const found = await repository.findByUserId(SAMPLE_USER.id);

  assert.equal(found?.status, RouteSessionStatus.InProgress);
});

test('archiveFinishedSession inserta una copia en route_session_history sin pisar nada', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);
  const finished: RouteSession = { ...SAMPLE_SESSION, status: RouteSessionStatus.Finished };

  await repository.archiveFinishedSession(SAMPLE_USER.id, finished);
  await repository.archiveFinishedSession(SAMPLE_USER.id, { ...finished, id: 'session-2' });

  const result = await client.execute({
    sql: 'SELECT user_id, session_json FROM route_session_history WHERE user_id = ? ORDER BY rowid',
    args: [SAMPLE_USER.id],
  });

  assert.equal(result.rows.length, 2);
  assert.deepEqual(JSON.parse(result.rows[0]?.session_json as string), finished);
});

test('findHistoryByUserId devuelve una lista vacía si el usuario no tiene histórico', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);

  assert.deepEqual(await repository.findHistoryByUserId(SAMPLE_USER.id), []);
});

test('findHistoryByUserId devuelve las entradas del usuario, más reciente primero', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);
  const older: RouteSession = { ...SAMPLE_SESSION, id: 'session-older', status: RouteSessionStatus.Finished };
  const newer: RouteSession = { ...SAMPLE_SESSION, id: 'session-newer', status: RouteSessionStatus.Finished };

  await client.execute({
    sql: 'INSERT INTO route_session_history (id, user_id, session_json, finished_at) VALUES (?, ?, ?, ?)',
    args: ['history-1', SAMPLE_USER.id, JSON.stringify(older), '2026-01-01T00:00:00.000Z'],
  });
  await client.execute({
    sql: 'INSERT INTO route_session_history (id, user_id, session_json, finished_at) VALUES (?, ?, ?, ?)',
    args: ['history-2', SAMPLE_USER.id, JSON.stringify(newer), '2026-01-02T00:00:00.000Z'],
  });

  const history = await repository.findHistoryByUserId(SAMPLE_USER.id);

  assert.deepEqual(
    history.map((entry) => entry.id),
    ['history-2', 'history-1'],
  );
  assert.deepEqual(history[0]?.session, newer);
});

test('findHistoryByUserId de un usuario nunca devuelve el histórico de otro', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);

  await client.execute({
    sql: 'INSERT INTO route_session_history (id, user_id, session_json, finished_at) VALUES (?, ?, ?, ?)',
    args: ['history-other', OTHER_USER.id, JSON.stringify(SAMPLE_SESSION), '2026-01-01T00:00:00.000Z'],
  });

  assert.deepEqual(await repository.findHistoryByUserId(SAMPLE_USER.id), []);
  assert.equal((await repository.findHistoryByUserId(OTHER_USER.id)).length, 1);
});

test('findHistoryByUserId descarta filas con session_json corrupto sin romper la consulta entera', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);

  await client.execute({
    sql: 'INSERT INTO route_session_history (id, user_id, session_json, finished_at) VALUES (?, ?, ?, ?)',
    args: ['history-corrupt', SAMPLE_USER.id, '{not valid json', '2026-01-01T00:00:00.000Z'],
  });
  await client.execute({
    sql: 'INSERT INTO route_session_history (id, user_id, session_json, finished_at) VALUES (?, ?, ?, ?)',
    args: ['history-ok', SAMPLE_USER.id, JSON.stringify(SAMPLE_SESSION), '2026-01-02T00:00:00.000Z'],
  });

  const history = await repository.findHistoryByUserId(SAMPLE_USER.id);

  assert.deepEqual(
    history.map((entry) => entry.id),
    ['history-ok'],
  );
});

test('findHistoryEntryById devuelve la entrada solo si pertenece al usuario', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);

  await client.execute({
    sql: 'INSERT INTO route_session_history (id, user_id, session_json, finished_at) VALUES (?, ?, ?, ?)',
    args: ['history-1', SAMPLE_USER.id, JSON.stringify(SAMPLE_SESSION), '2026-01-01T00:00:00.000Z'],
  });

  const found = await repository.findHistoryEntryById('history-1', SAMPLE_USER.id);
  assert.deepEqual(found, { id: 'history-1', finishedAt: '2026-01-01T00:00:00.000Z', session: SAMPLE_SESSION });

  // Mismo id, pero pedido por otro usuario: nunca debe encontrarlo.
  assert.equal(await repository.findHistoryEntryById('history-1', OTHER_USER.id), null);
});

test('findHistoryEntryById devuelve null si el id no existe', async () => {
  const client = await createMigratedClientWithUser();
  const repository = new SqliteRouteSessionRepository(client);

  assert.equal(await repository.findHistoryEntryById('id-inexistente', SAMPLE_USER.id), null);
});
