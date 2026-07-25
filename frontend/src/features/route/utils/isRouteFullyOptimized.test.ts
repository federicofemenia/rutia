import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DeliveryStatus, GeocodingStatus, type Delivery, type RouteSummaryInfo } from '../types';
import { buildDeliveryLegInfo } from './buildDeliveryLegInfo';
import { isRouteFullyOptimized } from './isRouteFullyOptimized';

const ADDRESS = { street: 'Calle', locality: 'Localidad', province: 'Buenos Aires', country: 'Argentina' };

function makeDelivery(overrides: Partial<Delivery> & Pick<Delivery, 'id'>): Delivery {
  return {
    address: ADDRESS,
    createdAt: new Date().toISOString(),
    coordinates: { latitude: 0, longitude: 0 },
    geocodingStatus: GeocodingStatus.Verified,
    status: DeliveryStatus.Pending,
    ...overrides,
  };
}

test('false cuando todavía no se optimizó nunca (routeSummary null)', () => {
  const deliveries = [makeDelivery({ id: 'd1' })];

  assert.equal(isRouteFullyOptimized(deliveries, buildDeliveryLegInfo(null), null), false);
});

test('true cuando no hay ninguna entrega ruteable (todas entregadas/falladas, o sin ubicación)', () => {
  const deliveries = [
    makeDelivery({ id: 'd1', status: DeliveryStatus.Delivered }),
    makeDelivery({ id: 'd2', status: DeliveryStatus.Failed }),
    makeDelivery({ id: 'd3', geocodingStatus: GeocodingStatus.NotFound, coordinates: undefined }),
  ];
  const routeSummary: RouteSummaryInfo = { totalDistance: 0, totalDuration: 0, hasCustomDestination: false, legs: [] };

  assert.equal(isRouteFullyOptimized(deliveries, buildDeliveryLegInfo(routeSummary), routeSummary), true);
});

test('true cuando todas las entregas ruteables están en el último resultado', () => {
  const deliveries = [makeDelivery({ id: 'd1' }), makeDelivery({ id: 'd2' })];
  const routeSummary: RouteSummaryInfo = {
    totalDistance: 1000,
    totalDuration: 100,
    hasCustomDestination: false,
    legs: [
      { distance: 500, duration: 50, fromDeliveryId: null, toDeliveryId: 'd1' },
      { distance: 300, duration: 30, fromDeliveryId: 'd1', toDeliveryId: 'd2' },
      { distance: 200, duration: 20, fromDeliveryId: 'd2', toDeliveryId: null },
    ],
  };

  assert.equal(isRouteFullyOptimized(deliveries, buildDeliveryLegInfo(routeSummary), routeSummary), true);
});

test('false cuando se agregó una entrega después de la última optimización', () => {
  const deliveries = [makeDelivery({ id: 'd1' }), makeDelivery({ id: 'd2' })];
  const routeSummary: RouteSummaryInfo = {
    totalDistance: 500,
    totalDuration: 50,
    hasCustomDestination: false,
    legs: [{ distance: 500, duration: 50, fromDeliveryId: 'd1', toDeliveryId: null }],
  };

  assert.equal(isRouteFullyOptimized(deliveries, buildDeliveryLegInfo(routeSummary), routeSummary), false);
});

test('ignora entregas ya entregadas/falladas aunque no estén en el último resultado (son historial, nunca se rutean)', () => {
  const deliveries = [makeDelivery({ id: 'd1' }), makeDelivery({ id: 'old', status: DeliveryStatus.Delivered })];
  const routeSummary: RouteSummaryInfo = {
    totalDistance: 500,
    totalDuration: 50,
    hasCustomDestination: false,
    legs: [{ distance: 500, duration: 50, fromDeliveryId: 'd1', toDeliveryId: null }],
  };

  assert.equal(isRouteFullyOptimized(deliveries, buildDeliveryLegInfo(routeSummary), routeSummary), true);
});

test('ignora entregas sin ubicación verificada (no se pueden rutear, no cuentan como pendientes de optimizar)', () => {
  const deliveries = [makeDelivery({ id: 'd1' }), makeDelivery({ id: 'unresolved', geocodingStatus: GeocodingStatus.Pending, coordinates: undefined })];
  const routeSummary: RouteSummaryInfo = {
    totalDistance: 500,
    totalDuration: 50,
    hasCustomDestination: false,
    legs: [{ distance: 500, duration: 50, fromDeliveryId: 'd1', toDeliveryId: null }],
  };

  assert.equal(isRouteFullyOptimized(deliveries, buildDeliveryLegInfo(routeSummary), routeSummary), true);
});
