import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DeliveryAddress } from './DeliveryAddress.js';
import { formatFullAddress, hasStructuredAddress } from './formatDeliveryAddress.js';

const FULL_ADDRESS: DeliveryAddress = {
  street: 'Av. Rivadavia',
  streetNumber: '1234',
  postalCode: '1722',
  locality: 'Merlo',
  province: 'Buenos Aires',
  country: 'Argentina',
  rawAddress: 'Av. Rivadavia 1234, Merlo, Buenos Aires, 1722',
};

test('formatFullAddress arma la dirección completa sin campos vacíos', () => {
  assert.equal(formatFullAddress(FULL_ADDRESS), 'Av. Rivadavia 1234, Merlo, Buenos Aires, 1722, Argentina');
});

test('formatFullAddress omite campos faltantes sin dejar comas ni espacios duplicados', () => {
  const partial: DeliveryAddress = {
    street: 'San Juan',
    locality: '',
    province: '',
    country: 'Argentina',
  };

  const result = formatFullAddress(partial);

  assert.equal(result, 'San Juan, Argentina');
  assert.doesNotMatch(result, /,\s*,/);
  assert.doesNotMatch(result, /\s{2,}/);
  assert.doesNotMatch(result, /undefined|null/);
});

test('hasStructuredAddress exige al menos calle y localidad', () => {
  assert.equal(hasStructuredAddress(FULL_ADDRESS), true);
  assert.equal(hasStructuredAddress({ ...FULL_ADDRESS, locality: '' }), false);
  assert.equal(hasStructuredAddress({ ...FULL_ADDRESS, street: '' }), false);
});
