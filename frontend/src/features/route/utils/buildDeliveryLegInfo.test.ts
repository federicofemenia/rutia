import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RouteSummaryInfo } from '../types';
import { buildDeliveryLegInfo } from './buildDeliveryLegInfo';

test('devuelve un mapa vacío cuando no hay routeSummary', () => {
  const result = buildDeliveryLegInfo(null);

  assert.equal(result.size, 0);
});

test('ignora el tramo cuyo origen es el punto de partida (no una entrega)', () => {
  const routeSummary: RouteSummaryInfo = {
    totalDistance: 1000,
    totalDuration: 100,
    hasCustomDestination: false,
    legs: [{ distance: 500, duration: 50, fromDeliveryId: null, toDeliveryId: 'd1' }],
  };

  const result = buildDeliveryLegInfo(routeSummary);

  assert.equal(result.size, 0);
});

test('un tramo entre dos entregas se mapea como "next" en la entrega de origen', () => {
  const routeSummary: RouteSummaryInfo = {
    totalDistance: 1000,
    totalDuration: 100,
    hasCustomDestination: false,
    legs: [{ distance: 500, duration: 50, fromDeliveryId: 'd1', toDeliveryId: 'd2' }],
  };

  const result = buildDeliveryLegInfo(routeSummary);

  assert.deepEqual(result.get('d1'), { kind: 'next', distance: 500, duration: 50 });
});

test('el último tramo sin destino configurado se mapea como "last"', () => {
  const routeSummary: RouteSummaryInfo = {
    totalDistance: 1000,
    totalDuration: 100,
    hasCustomDestination: false,
    legs: [{ distance: 700, duration: 70, fromDeliveryId: 'd2', toDeliveryId: null }],
  };

  const result = buildDeliveryLegInfo(routeSummary);

  assert.deepEqual(result.get('d2'), { kind: 'last' });
});

test('el último tramo con destino final configurado se mapea como "destination"', () => {
  const routeSummary: RouteSummaryInfo = {
    totalDistance: 1000,
    totalDuration: 100,
    hasCustomDestination: true,
    legs: [{ distance: 700, duration: 70, fromDeliveryId: 'd2', toDeliveryId: null }],
  };

  const result = buildDeliveryLegInfo(routeSummary);

  assert.deepEqual(result.get('d2'), { kind: 'destination', distance: 700, duration: 70 });
});
