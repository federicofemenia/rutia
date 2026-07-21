import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@libsql/client';
import { runMigrations } from './runMigrations.js';
import type { Migration } from './migrations/Migration.js';

const BASE_MIGRATIONS: Migration[] = [
  {
    id: '0001_init',
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS route_sessions (
        user_id TEXT PRIMARY KEY,
        session_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
    ],
  },
];

async function tableExists(client: ReturnType<typeof createClient>, name: string): Promise<boolean> {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: [name],
  });
  return result.rows.length > 0;
}

test('crea la tabla schema_migrations antes de poder consultar qué está aplicado', async () => {
  const client = createClient({ url: ':memory:' });
  await runMigrations(client, []);

  assert.equal(await tableExists(client, 'schema_migrations'), true);
});

test('aplica las migraciones pendientes y registra cada id en schema_migrations', async () => {
  const client = createClient({ url: ':memory:' });
  await runMigrations(client, BASE_MIGRATIONS);

  assert.equal(await tableExists(client, 'users'), true);
  assert.equal(await tableExists(client, 'route_sessions'), true);

  const result = await client.execute('SELECT id FROM schema_migrations');
  assert.deepEqual(
    result.rows.map((row) => row.id),
    ['0001_init'],
  );
});

test('es idempotente: correrlas dos veces no falla ni duplica el registro', async () => {
  const client = createClient({ url: ':memory:' });
  await runMigrations(client, BASE_MIGRATIONS);
  await runMigrations(client, BASE_MIGRATIONS);

  const result = await client.execute('SELECT id FROM schema_migrations');
  assert.deepEqual(
    result.rows.map((row) => row.id),
    ['0001_init'],
  );
});

test('aplica las migraciones en el orden de la lista, no en otro orden', async () => {
  const client = createClient({ url: ':memory:' });
  const ordered: Migration[] = [
    { id: '0001_create_widgets', statements: ['CREATE TABLE widgets (id TEXT PRIMARY KEY)'] },
    // Depende de que 0001 ya haya corrido — si el runner las aplicara en otro orden, esto falla.
    { id: '0002_seed_widget', statements: ["INSERT INTO widgets (id) VALUES ('a')"] },
  ];

  await runMigrations(client, ordered);

  const result = await client.execute('SELECT id FROM widgets');
  assert.deepEqual(
    result.rows.map((row) => row.id),
    ['a'],
  );

  const applied = await client.execute('SELECT id FROM schema_migrations ORDER BY rowid');
  assert.deepEqual(
    applied.rows.map((row) => row.id),
    ['0001_create_widgets', '0002_seed_widget'],
  );
});

test('si una sentencia de la migración falla, no se registra y se revierten sus cambios', async () => {
  const client = createClient({ url: ':memory:' });
  const failing: Migration[] = [
    {
      id: 'bad_migration',
      statements: [
        'CREATE TABLE temp_check (id TEXT)',
        // esta tabla no existe: la sentencia falla y debería revertir también la anterior.
        "INSERT INTO tabla_inexistente (id) VALUES ('x')",
      ],
    },
  ];

  await assert.rejects(() => runMigrations(client, failing));

  assert.equal(await tableExists(client, 'temp_check'), false, 'la tabla de la sentencia previa debió revertirse');

  const applied = await client.execute('SELECT id FROM schema_migrations');
  assert.deepEqual(applied.rows.map((row) => row.id), [], 'no debe quedar registrada la migración fallida');
});

test('no vuelve a intentar una migración ya aplicada aunque se le pase de nuevo en la lista', async () => {
  const client = createClient({ url: ':memory:' });
  await runMigrations(client, BASE_MIGRATIONS);

  // Si el runner reintentara "0001_init" ignorando el registro, este CREATE TABLE fallaría al
  // toparse con una tabla real ya creada con otra forma. Como es IF NOT EXISTS no rompe, pero lo
  // relevante acá es que ni siquiera se re-ejecuta: se corta apenas ve el id ya aplicado.
  await runMigrations(client, [...BASE_MIGRATIONS, { id: '0002_noop', statements: ['CREATE TABLE noop (id TEXT)'] }]);

  const applied = await client.execute('SELECT id FROM schema_migrations ORDER BY rowid');
  assert.deepEqual(
    applied.rows.map((row) => row.id),
    ['0001_init', '0002_noop'],
  );
});
