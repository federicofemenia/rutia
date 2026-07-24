import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toExtractedAddressQuery } from './GeminiVisionAddressExtractor.js';

test('mapea una respuesta válida de Gemini', () => {
  const result = toExtractedAddressQuery({
    query: 'San Martín 1234, Merlo, Buenos Aires, Argentina',
    confidence: 0.9,
    needsUserConfirmation: false,
  });

  assert.deepEqual(result, {
    query: 'San Martín 1234, Merlo, Buenos Aires, Argentina',
    confidence: 0.9,
    needsUserConfirmation: false,
  });
});

test('recorta espacios del query', () => {
  const result = toExtractedAddressQuery({ query: '  San Martín 1234  ', confidence: 0.5, needsUserConfirmation: true });

  assert.equal(result.query, 'San Martín 1234');
});

test('acota confidence al rango [0, 1] si Gemini devuelve un valor fuera de rango', () => {
  assert.equal(toExtractedAddressQuery({ query: 'x', confidence: 1.5, needsUserConfirmation: false }).confidence, 1);
  assert.equal(toExtractedAddressQuery({ query: 'x', confidence: -0.5, needsUserConfirmation: false }).confidence, 0);
});

test('valores faltantes o de tipo inesperado caen a defaults seguros (query vacío, confidence 0, needsUserConfirmation true)', () => {
  const result = toExtractedAddressQuery({ query: 123, confidence: 'alta', needsUserConfirmation: 'sí' });

  assert.deepEqual(result, { query: '', confidence: 0, needsUserConfirmation: true });
});

test('tira un error si la respuesta no es un objeto', () => {
  assert.throws(() => toExtractedAddressQuery(null), /formato inesperado/);
  assert.throws(() => toExtractedAddressQuery('texto suelto'), /formato inesperado/);
});
