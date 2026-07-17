import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ARGENTINE_PROVINCES, isArgentineProvince } from './argentineProvinces.js';

test('el catálogo contiene las 24 jurisdicciones argentinas', () => {
  assert.equal(ARGENTINE_PROVINCES.length, 24);
});

test('CABA y la provincia de Buenos Aires son entidades distintas en el catálogo', () => {
  assert.ok(ARGENTINE_PROVINCES.includes('Buenos Aires'));
  assert.ok(ARGENTINE_PROVINCES.includes('Ciudad Autónoma de Buenos Aires'));
  assert.notEqual(
    ARGENTINE_PROVINCES.indexOf('Buenos Aires'),
    ARGENTINE_PROVINCES.indexOf('Ciudad Autónoma de Buenos Aires'),
  );
});

test('isArgentineProvince reconoce valores del catálogo y rechaza otros', () => {
  assert.equal(isArgentineProvince('Mendoza'), true);
  assert.equal(isArgentineProvince('Narnia'), false);
});
