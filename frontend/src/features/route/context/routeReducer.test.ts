import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DeliveryStatus, GeocodingStatus, type Delivery, type RouteSession } from '../types';
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
  return { id: 'session-1', createdAt: new Date(), updatedAt: new Date(), deliveries };
}

test('UNDO_START_DELIVERY vuelve una entrega InProgress a Pending', () => {
  const state = makeState([makeDelivery({ id: 'd1', status: DeliveryStatus.InProgress })]);

  const next = routeReducer(state, { type: 'UNDO_START_DELIVERY', payload: { id: 'd1' } });

  assert.equal(next.deliveries[0]?.status, DeliveryStatus.Pending);
});

test('UNDO_START_DELIVERY no hace nada si la entrega no está InProgress', () => {
  const state = makeState([makeDelivery({ id: 'd1', status: DeliveryStatus.Delivered })]);

  const next = routeReducer(state, { type: 'UNDO_START_DELIVERY', payload: { id: 'd1' } });

  assert.equal(next, state);
});

test('UNDO_START_DELIVERY no hace nada si el id no existe', () => {
  const state = makeState([makeDelivery({ id: 'd1', status: DeliveryStatus.InProgress })]);

  const next = routeReducer(state, { type: 'UNDO_START_DELIVERY', payload: { id: 'id-inexistente' } });

  assert.equal(next, state);
});
