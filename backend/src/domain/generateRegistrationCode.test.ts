import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateRegistrationCode } from './generateRegistrationCode.js';

test('genera un código no vacío usando el alfabeto base64url', () => {
  const code = generateRegistrationCode();

  assert.ok(code.length > 0);
  assert.match(code, /^[A-Za-z0-9_-]+$/);
});

test('genera códigos distintos en llamadas sucesivas', () => {
  assert.notEqual(generateRegistrationCode(), generateRegistrationCode());
});
