import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDistance, formatDuration } from './formatRouteMetrics';

test('formatDistance muestra metros redondeados por debajo de 1km', () => {
  assert.equal(formatDistance(350), '350 m');
  assert.equal(formatDistance(999.6), '1000 m');
});

test('formatDistance muestra kilómetros con un decimal a partir de 1km', () => {
  assert.equal(formatDistance(1000), '1.0 km');
  assert.equal(formatDistance(2740), '2.7 km');
});

test('formatDuration muestra minutos por debajo de una hora', () => {
  assert.equal(formatDuration(60), '1 min');
  assert.equal(formatDuration(480), '8 min');
});

test('formatDuration muestra horas y minutos a partir de una hora', () => {
  assert.equal(formatDuration(3600), '1 h');
  assert.equal(formatDuration(3600 + 15 * 60), '1 h 15 min');
});
