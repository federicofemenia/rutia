import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DeliveryAddress } from '../types';
import { formatFullAddress, formatLocalityLine, formatStreetLine, hasStructuredAddress } from './formatDeliveryAddress';

const FULL_ADDRESS: DeliveryAddress = {
  street: 'Av. Rivadavia',
  streetNumber: '1234',
  postalCode: '1722',
  locality: 'Merlo',
  province: 'Buenos Aires',
  country: 'Argentina',
  rawAddress: 'Av. Rivadavia 1234, Merlo, Buenos Aires, 1722',
};

test('formatStreetLine junta calle y altura con espacio, no coma', () => {
  assert.equal(formatStreetLine(FULL_ADDRESS), 'Av. Rivadavia 1234');
  assert.equal(formatStreetLine({ ...FULL_ADDRESS, streetNumber: undefined }), 'Av. Rivadavia');
});

test('formatLocalityLine junta localidad, provincia y código postal', () => {
  assert.equal(formatLocalityLine(FULL_ADDRESS), 'Merlo, Buenos Aires, 1722');
});

test('formatLocalityLine omite el código postal cuando falta', () => {
  assert.equal(formatLocalityLine({ ...FULL_ADDRESS, postalCode: undefined }), 'Merlo, Buenos Aires');
});

test('formatFullAddress arma la dirección completa', () => {
  assert.equal(formatFullAddress(FULL_ADDRESS), 'Av. Rivadavia 1234, Merlo, Buenos Aires, 1722, Argentina');
});

test('formatFullAddress no genera undefined, comas dobles ni espacios dobles con campos vacíos', () => {
  const partial: DeliveryAddress = { street: 'San Juan', locality: '', province: '', country: 'Argentina' };
  const result = formatFullAddress(partial);

  assert.equal(result, 'San Juan, Argentina');
  assert.doesNotMatch(result, /undefined|null/);
  assert.doesNotMatch(result, /,\s*,/);
  assert.doesNotMatch(result, /\s{2,}/);
});

test('hasStructuredAddress exige calle y localidad no vacías', () => {
  assert.equal(hasStructuredAddress(FULL_ADDRESS), true);
  assert.equal(hasStructuredAddress({ ...FULL_ADDRESS, locality: '' }), false);
  assert.equal(hasStructuredAddress({ ...FULL_ADDRESS, street: '' }), false);
});
