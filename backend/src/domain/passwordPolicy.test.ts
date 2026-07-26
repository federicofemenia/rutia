import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPasswordValid, MIN_PASSWORD_LENGTH } from './passwordPolicy.js';

test('rechaza contraseñas más cortas que el mínimo', () => {
  assert.equal(isPasswordValid('a'.repeat(MIN_PASSWORD_LENGTH - 1)), false);
});

test('acepta contraseñas con exactamente el mínimo de largo', () => {
  assert.equal(isPasswordValid('a'.repeat(MIN_PASSWORD_LENGTH)), true);
});

test('acepta contraseñas más largas que el mínimo', () => {
  assert.equal(isPasswordValid('a'.repeat(MIN_PASSWORD_LENGTH + 5)), true);
});
