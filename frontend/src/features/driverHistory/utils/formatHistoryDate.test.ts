import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatHistoryDate } from './formatHistoryDate';

const NOW = new Date('2026-07-27T15:00:00');

test('devuelve "Hoy" para una fecha del mismo día', () => {
  assert.equal(formatHistoryDate('2026-07-27T09:30:00', NOW), 'Hoy');
});

test('devuelve "Ayer" para el día anterior', () => {
  assert.equal(formatHistoryDate('2026-07-26T23:59:00', NOW), 'Ayer');
});

test('devuelve DD/MM/AAAA para cualquier otro día', () => {
  assert.equal(formatHistoryDate('2026-07-21T12:00:00', NOW), '21/07/2026');
});

test('compara por día calendario, no por 24hs corridas', () => {
  // 2026-07-27T00:05 es "hoy" aunque falten menos de 24hs desde 2026-07-26T23:59.
  assert.equal(formatHistoryDate('2026-07-27T00:05:00', NOW), 'Hoy');
});
