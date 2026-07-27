import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DeliveryStatus,
  FailureReasonCode,
  GeocodingStatus,
  RouteSessionStatus,
  type Delivery,
  type RouteSession,
} from '../types';
import { routeReducer } from './routeReducer';

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

function makeState(deliveries: Delivery[]): RouteSession {
  return { id: 'session-1', createdAt: new Date(), updatedAt: new Date(), deliveries, status: RouteSessionStatus.InProgress };
}

test('UNDO_START_DELIVERY vuelve una entrega InProgress a Pending', () => {
  const state = makeState([makeDelivery({ id: 'd1', status: DeliveryStatus.InProgress })]);

  const next = routeReducer(state, { type: 'UNDO_START_DELIVERY', payload: { id: 'd1' } });

  assert.equal(next.deliveries[0]?.status, DeliveryStatus.Pending);
});

test('UNDO_START_DELIVERY también corrige desde Delivered o Failed (no solo InProgress)', () => {
  const delivered = makeState([
    makeDelivery({ id: 'd1', status: DeliveryStatus.Delivered, deliveredAt: '2026-01-01T00:00:00.000Z' }),
  ]);
  const failed = makeState([
    makeDelivery({ id: 'd1', status: DeliveryStatus.Failed, failureReasonCode: FailureReasonCode.CustomerAbsent }),
  ]);

  const fromDelivered = routeReducer(delivered, { type: 'UNDO_START_DELIVERY', payload: { id: 'd1' } });
  const fromFailed = routeReducer(failed, { type: 'UNDO_START_DELIVERY', payload: { id: 'd1' } });

  assert.equal(fromDelivered.deliveries[0]?.status, DeliveryStatus.Pending);
  assert.equal(fromDelivered.deliveries[0]?.deliveredAt, undefined);
  assert.equal(fromFailed.deliveries[0]?.status, DeliveryStatus.Pending);
  assert.equal(fromFailed.deliveries[0]?.failureReasonCode, undefined);
});

test('UNDO_START_DELIVERY no hace nada si la entrega está Pending', () => {
  const state = makeState([makeDelivery({ id: 'd1', status: DeliveryStatus.Pending })]);

  const next = routeReducer(state, { type: 'UNDO_START_DELIVERY', payload: { id: 'd1' } });

  assert.equal(next, state);
});

test('UNDO_START_DELIVERY no hace nada si el id no existe', () => {
  const state = makeState([makeDelivery({ id: 'd1', status: DeliveryStatus.InProgress })]);

  const next = routeReducer(state, { type: 'UNDO_START_DELIVERY', payload: { id: 'id-inexistente' } });

  assert.equal(next, state);
});

test('COMPLETE_DELIVERY corrige una entrega marcada Failed por error, y limpia el motivo de fallo', () => {
  const state = makeState([
    makeDelivery({ id: 'd1', status: DeliveryStatus.Failed, failureReasonCode: FailureReasonCode.CustomerAbsent }),
  ]);

  const next = routeReducer(state, { type: 'COMPLETE_DELIVERY', payload: { id: 'd1' } });

  assert.equal(next.deliveries[0]?.status, DeliveryStatus.Delivered);
  assert.equal(next.deliveries[0]?.failureReasonCode, undefined);
});

test('COMPLETE_DELIVERY no hace nada si la entrega está Pending (hay que iniciarla primero)', () => {
  const state = makeState([makeDelivery({ id: 'd1', status: DeliveryStatus.Pending })]);

  const next = routeReducer(state, { type: 'COMPLETE_DELIVERY', payload: { id: 'd1' } });

  assert.equal(next, state);
});

test('FAIL_DELIVERY corrige una entrega marcada Delivered por error, y limpia deliveredAt', () => {
  const state = makeState([
    makeDelivery({ id: 'd1', status: DeliveryStatus.Delivered, deliveredAt: '2026-01-01T00:00:00.000Z' }),
  ]);

  const next = routeReducer(state, {
    type: 'FAIL_DELIVERY',
    payload: { id: 'd1', failureReasonCode: FailureReasonCode.WrongAddress },
  });

  assert.equal(next.deliveries[0]?.status, DeliveryStatus.Failed);
  assert.equal(next.deliveries[0]?.deliveredAt, undefined);
  assert.equal(next.deliveries[0]?.failureReasonCode, FailureReasonCode.WrongAddress);
});

test('FAIL_DELIVERY no hace nada si la entrega está Pending', () => {
  const state = makeState([makeDelivery({ id: 'd1', status: DeliveryStatus.Pending })]);

  const next = routeReducer(state, {
    type: 'FAIL_DELIVERY',
    payload: { id: 'd1', failureReasonCode: FailureReasonCode.Other },
  });

  assert.equal(next, state);
});
