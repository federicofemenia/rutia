import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeUsername } from './normalizeUsername.js';

test('recorta espacios y pasa a minúsculas', () => {
  assert.equal(normalizeUsername('  Juan.Perez  '), 'juan.perez');
});

test('dos variantes de mayúsculas/espacios del mismo username normalizan igual', () => {
  assert.equal(normalizeUsername('JUAN'), normalizeUsername(' juan '));
});
