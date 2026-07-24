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

test('caso real: entre varios tramos empatados, prioriza el que coincide con el código postal pedido', () => {
  // Reproduce "San Juan 2325, Merlo, CP 1722": Geoapify devuelve 4 candidatos empatados en
  // provincia/localidad/calle/altura — el primero en el array tiene un CP distinto (B1718EVD),
  // pero hay otros con CP que sí coincide (B1722ERH, contiene "1722"). Antes de este fix ganaba
  // el primero sin importar el CP.
  const results: GeoapifyResult[] = [
    {
      lat: -34.6607653,
      lon: -58.7148336,
      formatted: 'San Juan 2325, B1718 EVD Merlo, Argentina',
      street: 'San Juan',
      housenumber: '2325',
      city: 'Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      postcode: 'B1718EVD',
      rank: { confidence: 0.5 },
    },
    {
      lat: -34.6589664,
      lon: -58.7260005,
      formatted: 'San Juan 2325, B1722 ERH Merlo, Argentina',
      street: 'San Juan',
      housenumber: '2325',
      city: 'Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      postcode: 'B1722ERH',
      rank: { confidence: 0.5 },
    },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'verified');
  assert.equal(result.status === 'verified' && result.coordinates.latitude, -34.6589664);
  assert.equal(result.status === 'verified' && result.matchedAddress?.postalCode, 'B1722ERH');
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

test('empate real sin código postal para desempatar: ambiguous con las dos ubicaciones como opciones, no elige una por confidence', () => {
  // Ya no se resuelve solo: dos ubicaciones físicas distintas, mismo score, sin CP en la
  // respuesta que ayude a distinguirlas — usar `confidence` para elegir en silencio puede mandar
  // al chofer al lugar equivocado con toda confianza. Se ofrecen ambas como opciones.
  const results: GeoapifyResult[] = [
    {
      lat: -34.1,
      lon: -58.1,
      formatted: 'San Juan 2325, Barrio A, Merlo, Argentina',
      street: 'San Juan',
      housenumber: '2325',
      city: 'Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      rank: { confidence: 0.4 },
    },
    {
      lat: -34.2,
      lon: -58.2,
      formatted: 'San Juan 2325, Barrio B, Merlo, Argentina',
      street: 'San Juan',
      housenumber: '2325',
      city: 'Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      rank: { confidence: 0.9 },
    },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'ambiguous');
  const options = result.status === 'ambiguous' ? result.options : undefined;
  assert.equal(options?.length, 2);
  // Orden por confidence descendente (mismo criterio que ya se usaba para elegir "el mejor" antes
  // de este cambio) — el de mayor confidence (Barrio B, 0.9) va primero.
  assert.deepEqual(
    options?.map((option) => option.coordinates),
    [
      { latitude: -34.2, longitude: -58.2 },
      { latitude: -34.1, longitude: -58.1 },
    ],
  );
  assert.equal(options?.[0]?.label, 'San Juan 2325, Barrio B, Merlo, Argentina');
});

test('caso real: 3 tramos de la misma calle con el mismo CP pedido, en ubicaciones distintas — ambiguous con 3 opciones', () => {
  // Reproduce exactamente "San Juan 2325, Merlo, CP 1722" en vivo: 3 candidatos con postcode
  // B1722ERH (coincide con 1722), misma localidad, mismo score — pero son 3 lugares físicos
  // distintos (distintos barrios dentro de Merlo). El código postal ya no alcanza para elegir
  // uno solo porque los 3 lo comparten.
  const results: GeoapifyResult[] = [
    {
      lat: -34.6575276,
      lon: -58.7352916,
      formatted: 'San Juan 2325, Lago del Bosque, B1722 ERH Merlo, Argentina',
      street: 'San Juan',
      housenumber: '2325',
      city: 'Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      postcode: 'B1722ERH',
      rank: { confidence: 0.5 },
    },
    {
      lat: -34.6584076,
      lon: -58.7294762,
      formatted: 'San Juan 2325, Barrio Argentino, B1722 ERH Merlo, Argentina',
      street: 'San Juan',
      housenumber: '2325',
      city: 'Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      postcode: 'B1722ERH',
      rank: { confidence: 0.5 },
    },
    {
      lat: -34.6589664,
      lon: -58.7260005,
      formatted: 'San Juan 2325, B1722 ERH Merlo, Argentina',
      street: 'San Juan',
      housenumber: '2325',
      city: 'Merlo',
      state: 'Buenos Aires',
      country_code: 'ar',
      postcode: 'B1722ERH',
      rank: { confidence: 0.5 },
    },
  ];

  const result = selectBestGeoapifyResult(results, BASE_ADDRESS);

  assert.equal(result.status, 'ambiguous');
  const options = result.status === 'ambiguous' ? result.options : undefined;
  assert.equal(options?.length, 3);
});
