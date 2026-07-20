import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';
import { type NominatimCandidate, selectBestCandidate } from './NominatimCandidateSelector.js';

const BASE_ADDRESS: DeliveryAddress = {
  street: 'San Juan',
  streetNumber: '2325',
  postalCode: '1722',
  locality: 'Merlo',
  province: 'Buenos Aires',
  country: 'Argentina',
};

test('acepta un candidato cuya localidad viene detrás de un prefijo administrativo ("Partido de Merlo")', () => {
  const candidates: NominatimCandidate[] = [
    {
      lat: '-34.6589664',
      lon: '-58.7260005',
      display_name: 'San Juan, Partido de Merlo, Buenos Aires, Argentina',
      address: {
        road: 'San Juan',
        house_number: '2325',
        county: 'Partido de Merlo',
        state: 'Buenos Aires',
        country_code: 'ar',
        postcode: '1722',
      },
    },
  ];

  const result = selectBestCandidate(candidates, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
});

test('acepta un candidato aunque Nominatim no devuelva código postal', () => {
  const candidates: NominatimCandidate[] = [
    {
      lat: '-34.6589664',
      lon: '-58.7260005',
      address: { road: 'San Juan', house_number: '2325', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar' },
    },
  ];

  const result = selectBestCandidate(candidates, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
  assert.equal(result.status === 'verified' && result.matchedAddress?.postalCode, undefined);
});

test('acepta un candidato con calle correcta aunque falte house_number, no lo marca notFound', () => {
  const candidates: NominatimCandidate[] = [
    {
      lat: '-34.6589664',
      lon: '-58.7260005',
      address: { road: 'San Juan', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar', postcode: '1722' },
    },
  ];

  const result = selectBestCandidate(candidates, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
});

test('reconoce la localidad cuando aparece en un campo alternativo (town en vez de city)', () => {
  const candidates: NominatimCandidate[] = [
    {
      lat: '-34.6589664',
      lon: '-58.7260005',
      address: { road: 'San Juan', house_number: '2325', town: 'Merlo', state: 'Buenos Aires', country_code: 'ar' },
    },
  ];

  const result = selectBestCandidate(candidates, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
});

test('descarta un candidato cuya provincia es claramente distinta a la esperada', () => {
  const candidates: NominatimCandidate[] = [
    {
      lat: '-31.4201',
      lon: '-64.1888',
      address: { road: 'San Juan', house_number: '2325', city: 'Merlo', state: 'Córdoba', country_code: 'ar' },
    },
  ];

  const result = selectBestCandidate(candidates, BASE_ADDRESS);

  assert.equal(result.status, 'notFound');
});

test('elige el candidato correcto aunque no sea el primero de la respuesta', () => {
  const candidates: NominatimCandidate[] = [
    {
      // Primero en la lista, pero en una localidad distinta a la esperada.
      lat: '-34.6167',
      lon: '-58.6167',
      address: { road: 'San Juan', city: 'Ituzaingó', state: 'Buenos Aires', country_code: 'ar' },
    },
    {
      // Segundo, pero es el que realmente coincide con la dirección pedida.
      lat: '-34.6589664',
      lon: '-58.7260005',
      address: { road: 'San Juan', house_number: '2325', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar' },
    },
  ];

  const result = selectBestCandidate(candidates, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
  assert.equal(result.status === 'verified' && result.coordinates.latitude, -34.6589664);
  assert.equal(result.status === 'verified' && result.coordinates.longitude, -58.7260005);
});

test('devuelve notFound cuando Nominatim no responde ningún candidato', () => {
  const result = selectBestCandidate([], BASE_ADDRESS);

  assert.equal(result.status, 'notFound');
});

test('caso real: "San Juan 2325, Merlo, Buenos Aires" — Nominatim devuelve 4 tramos de la misma calle sin house_number, antes daba ambiguous', () => {
  // Respuesta real de nominatim.openstreetmap.org para este caso (capturada en vivo): 4 tramos
  // de la calle "San Juan" en Merlo, mismo `importance`, ninguno con `house_number`, con la
  // provincia informada como "Buenos Aires" y la localidad como "Merlo" (partido).
  const candidates: NominatimCandidate[] = [
    {
      lat: '-34.6589664',
      lon: '-58.7260005',
      display_name: 'San Juan, Merlo, Partido de Merlo, Buenos Aires, B1722ERH, Argentina',
      address: { road: 'San Juan', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar', postcode: 'B1722ERH' },
      importance: 0.053384999618524415,
    },
    {
      lat: '-34.6607653',
      lon: '-58.7148336',
      display_name: 'San Juan, Merlo, Partido de Merlo, Buenos Aires, B1718EVD, Argentina',
      address: { road: 'San Juan', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar', postcode: 'B1718EVD' },
      importance: 0.053384999618524415,
    },
    {
      lat: '-34.6584076',
      lon: '-58.7294762',
      display_name: 'San Juan, Barrio Argentino, Merlo, Partido de Merlo, Buenos Aires, B1722ERH, Argentina',
      address: { road: 'San Juan', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar', postcode: 'B1722ERH' },
      importance: 0.053384999618524415,
    },
    {
      lat: '-34.6575276',
      lon: '-58.7352916',
      display_name: 'San Juan, Lago del Bosque, Merlo, Partido de Merlo, Buenos Aires, B1722ERH, Argentina',
      address: { road: 'San Juan', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar', postcode: 'B1722ERH' },
      importance: 0.053384999618524415,
    },
  ];

  const result = selectBestCandidate(candidates, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
  assert.equal(result.status === 'verified' && result.coordinates.latitude, -34.6589664);
  assert.equal(result.status === 'verified' && result.coordinates.longitude, -58.7260005);
});
