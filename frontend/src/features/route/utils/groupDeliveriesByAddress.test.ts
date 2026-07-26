import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GeocodingStatus, DeliveryStatus, type Delivery } from '../types';
import { groupDeliveriesByAddress } from './groupDeliveriesByAddress';

const ADDRESS = { street: 'Calle', streetNumber: '123', locality: 'Localidad', province: 'Buenos Aires', country: 'Argentina' };
const EMPTY_ADDRESS = { street: '', locality: '', province: '', country: 'Argentina' };

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

test('sin duplicados, cada entrega queda en su propio grupo', () => {
  const deliveries = [makeDelivery({ id: 'd1' }), makeDelivery({ id: 'd2', address: { ...ADDRESS, street: 'Otra calle' } })];

  const groups = groupDeliveriesByAddress(deliveries);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0]?.deliveries.map((d) => d.id), ['d1']);
  assert.deepEqual(groups[1]?.deliveries.map((d) => d.id), ['d2']);
});

test('dos entregas con el mismo placeId se agrupan aunque el texto de la dirección difiera', () => {
  const deliveries = [
    makeDelivery({ id: 'd1', address: { ...ADDRESS, placeId: 'place-1' } }),
    makeDelivery({ id: 'd2', address: { ...ADDRESS, street: 'Texto distinto', placeId: 'place-1' } }),
  ];

  const groups = groupDeliveriesByAddress(deliveries);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0]?.deliveries.map((d) => d.id), ['d1', 'd2']);
});

test('dos entregas con placeId distinto nunca se agrupan, aunque el texto coincida', () => {
  const deliveries = [
    makeDelivery({ id: 'd1', address: { ...ADDRESS, placeId: 'place-1' } }),
    makeDelivery({ id: 'd2', address: { ...ADDRESS, placeId: 'place-2' } }),
  ];

  const groups = groupDeliveriesByAddress(deliveries);

  assert.equal(groups.length, 2);
});

test('sin placeId, se agrupan por dirección normalizada (case-insensitive)', () => {
  const deliveries = [
    makeDelivery({ id: 'd1', address: { ...ADDRESS } }),
    makeDelivery({ id: 'd2', address: { ...ADDRESS, street: ADDRESS.street.toUpperCase() } }),
  ];

  const groups = groupDeliveriesByAddress(deliveries);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0]?.deliveries.map((d) => d.id), ['d1', 'd2']);
});

test('entregas con dirección todavía sin resolver nunca se agrupan entre sí', () => {
  const deliveries = [
    makeDelivery({ id: 'd1', address: EMPTY_ADDRESS, geocodingStatus: GeocodingStatus.Pending, coordinates: undefined }),
    makeDelivery({ id: 'd2', address: EMPTY_ADDRESS, geocodingStatus: GeocodingStatus.Pending, coordinates: undefined }),
  ];

  const groups = groupDeliveriesByAddress(deliveries);

  assert.equal(groups.length, 2);
});

test('preserva el orden: cada grupo aparece en la posición de su primera entrega', () => {
  const deliveries = [
    makeDelivery({ id: 'd1', address: { ...ADDRESS, placeId: 'place-1' } }),
    makeDelivery({ id: 'd2', address: { ...ADDRESS, street: 'Otra calle' } }),
    makeDelivery({ id: 'd3', address: { ...ADDRESS, placeId: 'place-1' } }),
  ];

  const groups = groupDeliveriesByAddress(deliveries);

  assert.deepEqual(
    groups.map((g) => g.deliveries.map((d) => d.id)),
    [
      ['d1', 'd3'],
      ['d2'],
    ],
  );
});
