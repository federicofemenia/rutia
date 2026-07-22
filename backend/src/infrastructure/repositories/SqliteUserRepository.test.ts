import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient, type Client } from '@libsql/client';
import { runMigrations } from '../database/runMigrations.js';
import { migrations } from '../database/migrations/migrations.js';
import { UserRole } from '../../domain/UserRole.js';
import type { User } from '../../domain/User.js';
import { SqliteUserRepository } from './SqliteUserRepository.js';

async function createMigratedClient(): Promise<Client> {
  const client = createClient({ url: ':memory:' });
  await runMigrations(client, migrations);
  return client;
}

const SAMPLE_USER: User = {
  id: 'user-1',
  name: 'chofer',
  role: UserRole.Chofer,
  passwordHash: 'hashed-password',
  createdAt: '2026-01-01T00:00:00.000Z',
};

test('create + findById devuelve el usuario creado', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);

  await repository.create(SAMPLE_USER);
  const found = await repository.findById(SAMPLE_USER.id);

  assert.deepEqual(found, SAMPLE_USER);
});

test('findByName no distingue mayúsculas/minúsculas', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);
  await repository.create(SAMPLE_USER);

  const found = await repository.findByName('CHOFER');

  assert.deepEqual(found, SAMPLE_USER);
});

test('findByName y findById devuelven null si no existe', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);

  assert.equal(await repository.findByName('nadie'), null);
  assert.equal(await repository.findById('id-inexistente'), null);
});

test('create de un admin conserva el rol correcto', async () => {
  const client = await createMigratedClient();
  const repository = new SqliteUserRepository(client);
  const admin: User = { ...SAMPLE_USER, id: 'user-2', name: 'admin', role: UserRole.Admin };

  await repository.create(admin);
  const found = await repository.findById(admin.id);

  assert.equal(found?.role, UserRole.Admin);
});
