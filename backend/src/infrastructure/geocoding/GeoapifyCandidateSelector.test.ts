import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';
import { type GeoapifyResult, selectBestGeoapifyResult } from './GeoapifyCandidateSelector.js';

const BASE_ADDRESS: DeliveryAddress = {
  street: 'San Juan',
  streetNumber: '2325',
  postalCode: '1722',
  locality: 'Merlo',
  province: 'Buenos Aires',
  country: 'Argentina',
};

test('acepta un resultado cuya localidad viene solo en el campo county ("Partido de Merlo")', () => {
  const results: GeoapifyResult[] = [
    {
      lat: -34.6589664,
      lon: -58.726_0005,
      formatted: 'San Juan 2325, Partido de Merlo, Buenos Aires, Argentina',
      street: 'San Juan',
      housenumber: '2325',
      county: 'Partido de Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      postcode: '1722',
    },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
});

test('acepta un resultado aunque Geoapify no devuelva código postal', () => {
  const results: GeoapifyResult[] = [
    { lat: -34.6589664, lon: -58.726_0005, street: 'San Juan', housenumber: '2325', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar' },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
  assert.equal(result.status === 'verified' && result.matchedAddress?.postalCode, undefined);
});

test('acepta un resultado con calle correcta aunque falte housenumber, no lo marca notFound', () => {
  const results: GeoapifyResult[] = [
    { lat: -34.6589664, lon: -58.726_0005, street: 'San Juan', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar', postcode: '1722' },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
});

test('reconoce la localidad cuando aparece en suburb en vez de city', () => {
  const results: GeoapifyResult[] = [
    { lat: -34.6589664, lon: -58.726_0005, street: 'San Juan', housenumber: '2325', suburb: 'Merlo', state: 'Buenos Aires', country_code: 'ar' },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
});

test('caso real: locality "caba" acepta un resultado cuyo city es "Ciudad Autónoma de Buenos Aires"', () => {
  const address: DeliveryAddress = {
    street: 'Peña',
    streetNumber: '2058',
    postalCode: '1113',
    locality: 'caba',
    province: 'Ciudad Autónoma de Buenos Aires',
    country: 'Argentina',
  };
  const results: GeoapifyResult[] = [
    {
      lat: -34.592463,
      lon: -58.395767,
      formatted: 'Pena 2058, Recoleta, 1126 Ciudad Autónoma de Buenos Aires, Argentina',
      street: 'Peña',
      housenumber: '2058',
      suburb: 'Recoleta',
      city: 'Ciudad Autónoma de Buenos Aires',
      state: 'Ciudad de Buenos Aires',
      country_code: 'ar',
      postcode: '1126',
      rank: { confidence: 0.8 },
    },
  ];

  const result = selectBestGeoapifyResult(results, address);

  assert.equal(result.status, 'verified');
});

test('descarta un resultado cuya provincia es claramente distinta a la esperada', () => {
  const results: GeoapifyResult[] = [
    { lat: -31.4201, lon: -64.1888, street: 'San Juan', housenumber: '2325', city: 'Merlo', state: 'Córdoba', country_code: 'ar' },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'notFound');
});

test('elige el resultado correcto aunque no sea el primero de la respuesta', () => {
  const results: GeoapifyResult[] = [
    // Primero en la lista, pero en una localidad distinta a la esperada.
    { lat: -34.6167, lon: -58.6167, street: 'San Juan', city: 'Ituzaingó', state: 'Buenos Aires', country_code: 'ar' },
    // Segundo, pero es el que realmente coincide con la dirección pedida.
    { lat: -34.6589664, lon: -58.726_0005, street: 'San Juan', housenumber: '2325', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar' },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
  assert.equal(result.status === 'verified' && result.coordinates.latitude, -34.6589664);
  assert.equal(result.status === 'verified' && result.coordinates.longitude, -58.726_0005);
});

test('devuelve notFound cuando Geoapify no responde ningún resultado', () => {
  const result = selectBestGeoapifyResult([], BASE_ADDRESS);

  assert.equal(result.status, 'notFound');
});

test('caso real: varios tramos de la misma calle sin housenumber, misma confidence, se resuelve verified', () => {
  const results: GeoapifyResult[] = [
    {
      lat: -34.6589664,
      lon: -58.726_0005,
      formatted: 'San Juan, Merlo, Buenos Aires, B1722ERH, Argentina',
      street: 'San Juan',
      city: 'Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      postcode: 'B1722ERH',
      rank: { confidence: 0.7 },
    },
    {
      lat: -34.6607653,
      lon: -58.714_8336,
      formatted: 'San Juan, Merlo, Buenos Aires, B1718EVD, Argentina',
      street: 'San Juan',
      city: 'Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      postcode: 'B1718EVD',
      rank: { confidence: 0.7 },
    },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
  assert.equal(result.status === 'verified' && result.coordinates.latitude, -34.6589664);
});

test('usa confidence como desempate cuando el score propio es idéntico y la localidad coincide en ambos', () => {
  const results: GeoapifyResult[] = [
    { lat: -34.1, lon: -58.1, street: 'San Juan', housenumber: '2325', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar', rank: { confidence: 0.4 } },
    { lat: -34.2, lon: -58.2, street: 'San Juan', housenumber: '2325', city: 'Merlo', state: 'Buenos Aires', country_code: 'ar', rank: { confidence: 0.9 } },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
  assert.equal(result.status === 'verified' && result.coordinates.latitude, -34.2);
});
