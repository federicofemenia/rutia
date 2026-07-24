import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressExtractor, ExtractedAddressQuery } from '../domain/AddressExtractor.js';
import { ExtractAddressFromImage } from './ExtractAddressFromImage.js';

class StubExtractor implements AddressExtractor {
  constructor(
    private readonly result: ExtractedAddressQuery,
    public receivedImage?: string,
  ) {}

  async extract(imageBase64: string): Promise<ExtractedAddressQuery> {
    this.receivedImage = imageBase64;
    return this.result;
  }
}

test('delega en el extractor inyectado y devuelve su resultado tal cual', async () => {
  const expected: ExtractedAddressQuery = {
    query: 'San Martín 1234, Merlo, Buenos Aires, Argentina',
    confidence: 0.8,
    needsUserConfirmation: false,
  };
  const extractor = new StubExtractor(expected);
  const useCase = new ExtractAddressFromImage(extractor);

  const result = await useCase.execute('data:image/png;base64,fake');

  assert.deepEqual(result, expected);
  assert.equal(extractor.receivedImage, 'data:image/png;base64,fake');
});
