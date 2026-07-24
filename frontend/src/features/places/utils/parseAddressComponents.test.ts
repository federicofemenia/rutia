import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAddressComponents } from './parseAddressComponents.js';

function component(longText: string, types: string[]): google.maps.places.AddressComponent {
  return { longText, shortText: longText, types } as google.maps.places.AddressComponent;
}

test('parsea todos los componentes cuando están todos presentes', () => {
  const result = parseAddressComponents([
    component('San Martín', ['route']),
    component('1234', ['street_number']),
    component('Merlo', ['locality', 'political']),
    component('1722', ['postal_code']),
    component('Buenos Aires', ['administrative_area_level_1', 'political']),
    component('Argentina', ['country', 'political']),
  ]);

  assert.deepEqual(result, {
    street: 'San Martín',
    streetNumber: '1234',
    locality: 'Merlo',
    postalCode: '1722',
    province: 'Buenos Aires',
    country: 'Argentina',
  });
});

test('usa sublocality como fallback de localidad cuando no hay locality', () => {
  const result = parseAddressComponents([
    component('Palermo', ['sublocality', 'sublocality_level_1']),
    component('Ciudad Autónoma de Buenos Aires', ['administrative_area_level_1']),
  ]);

  assert.equal(result.locality, 'Palermo');
});

test('usa administrative_area_level_2 como último fallback de localidad', () => {
  const result = parseAddressComponents([component('Partido de Merlo', ['administrative_area_level_2', 'political'])]);

  assert.equal(result.locality, 'Partido de Merlo');
});

test('campos ausentes caen a string vacío (calle/localidad/provincia) o undefined (altura/CP), país por defecto Argentina', () => {
  const result = parseAddressComponents([]);

  assert.deepEqual(result, { street: '', streetNumber: undefined, locality: '', postalCode: undefined, province: '', country: 'Argentina' });
});
