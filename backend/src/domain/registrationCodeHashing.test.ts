import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashRegistrationCode, normalizeRegistrationCode } from './registrationCodeHashing.js';

test('normalizeRegistrationCode recorta espacios pero no cambia mayúsculas/minúsculas', () => {
  assert.equal(normalizeRegistrationCode('  AbC123  '), 'AbC123');
});

test('hashRegistrationCode es determinístico para el mismo código y secreto', () => {
  assert.equal(hashRegistrationCode('abc123', 'secret'), hashRegistrationCode('abc123', 'secret'));
});

test('hashRegistrationCode ignora espacios alrededor del código', () => {
  assert.equal(hashRegistrationCode('abc123', 'secret'), hashRegistrationCode('  abc123  ', 'secret'));
});

test('hashRegistrationCode da resultados distintos para secretos distintos', () => {
  assert.notEqual(hashRegistrationCode('abc123', 'secret-a'), hashRegistrationCode('abc123', 'secret-b'));
});

test('hashRegistrationCode da resultados distintos para códigos distintos', () => {
  assert.notEqual(hashRegistrationCode('abc123', 'secret'), hashRegistrationCode('xyz789', 'secret'));
});

test('hashRegistrationCode devuelve un hex de 64 caracteres (SHA-256)', () => {
  assert.match(hashRegistrationCode('abc123', 'secret'), /^[0-9a-f]{64}$/);
});
