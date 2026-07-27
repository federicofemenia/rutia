import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Guardia estructural: la RouteSession (rutas/entregas de un chofer) se persiste exclusivamente
 * vía el backend, scopeado por usuario — nunca en `localStorage` (bug ya corregido: una clave
 * global ahí hacía que un chofer nuevo heredara la ruta de la cuenta anterior en ese navegador).
 * Este test falla si algún archivo de estas features vuelve a tocar `localStorage`, sin depender
 * de que alguien se acuerde de revisarlo a mano en cada PR.
 */
const GUARDED_DIRECTORIES = [
  join(__dirname, '..', 'route'),
  join(__dirname, '..', 'route-sync'),
  join(__dirname, '..', 'scanner'),
];

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(fullPath);
    }

    const isSourceFile = /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts');
    return isSourceFile ? [fullPath] : [];
  });
}

// Matchea uso real de la API (`localStorage.getItem(...)`, etc.), no menciones en comentarios
// como "nunca se persiste en localStorage" — esas son justamente el objetivo a mantener cierto.
const LOCAL_STORAGE_USAGE = /localStorage\s*\.\s*(getItem|setItem|removeItem|clear|key)\s*\(/;

test('ningún archivo de route/route-sync/scanner usa la API de localStorage', () => {
  const offenders = GUARDED_DIRECTORIES.flatMap((dir) =>
    listSourceFiles(dir).filter((filePath) => LOCAL_STORAGE_USAGE.test(readFileSync(filePath, 'utf-8'))),
  );

  assert.deepEqual(offenders, []);
});
