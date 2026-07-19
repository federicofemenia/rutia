import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeLocalityName, normalizePostalCode, normalizeProvinceName } from './normalizeAddress.js';

test('normalizeProvinceName reconoce abreviaturas y variantes comunes', () => {
  assert.equal(normalizeProvinceName('Bs As'), 'Buenos Aires');
  assert.equal(normalizeProvinceName('Pcia. de Buenos Aires'), 'Buenos Aires');
  assert.equal(normalizeProvinceName('Provincia de Buenos Aires'), 'Buenos Aires');
  assert.equal(normalizeProvinceName('CABA'), 'Ciudad Autónoma de Buenos Aires');
  assert.equal(normalizeProvinceName('Capital Federal'), 'Ciudad Autónoma de Buenos Aires');
  assert.equal(normalizeProvinceName('Mendoza'), 'Mendoza');
  assert.equal(normalizeProvinceName('mendoza'), 'Mendoza');
  assert.equal(normalizeProvinceName('cordoba'), 'Córdoba');
  assert.equal(normalizeProvinceName('santa fe'), 'Santa Fe');
});

test('CABA y Buenos Aires nunca normalizan al mismo valor', () => {
  assert.notEqual(normalizeProvinceName('CABA'), normalizeProvinceName('Buenos Aires'));
  assert.notEqual(normalizeProvinceName('Capital Federal'), normalizeProvinceName('Provincia de Buenos Aires'));
});

test('normalizeProvinceName conserva el texto original cuando no reconoce una equivalencia', () => {
  assert.equal(normalizeProvinceName('Provincia desconocida'), 'Provincia desconocida');
  assert.equal(normalizeProvinceName('  Provincia   desconocida  '), 'Provincia desconocida');
});

test('normalizePostalCode limpia formato sin validar de forma estricta', () => {
  assert.equal(normalizePostalCode('1722'), '1722');
  assert.equal(normalizePostalCode(' 1722 '), '1722');
  assert.equal(normalizePostalCode('m5502abc'), 'M5502ABC');
  assert.equal(normalizePostalCode('M 5502 ABC'), 'M5502ABC');
  assert.equal(normalizePostalCode(''), undefined);
  assert.equal(normalizePostalCode('   '), undefined);
});

test('normalizeLocalityName quita prefijos administrativos comunes', () => {
  assert.equal(normalizeLocalityName('Partido de Merlo'), 'merlo');
  assert.equal(normalizeLocalityName('Municipio de San Isidro'), 'san isidro');
  assert.equal(normalizeLocalityName('Departamento de Capital'), 'capital');
  assert.equal(normalizeLocalityName('Provincia de Mendoza'), 'mendoza');
});

test('normalizeLocalityName ignora mayúsculas, tildes, puntuación y espacios duplicados', () => {
  assert.equal(normalizeLocalityName('Merlo'), 'merlo');
  assert.equal(normalizeLocalityName('MERLO'), 'merlo');
  assert.equal(normalizeLocalityName('  Merlo  '), 'merlo');
  assert.equal(normalizeLocalityName('San Martín'), 'san martin');
  assert.equal(normalizeLocalityName('San, Martín.'), 'san martin');
});
