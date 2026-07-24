import type { AddressExtractor, ExtractedAddressQuery } from '../domain/AddressExtractor.js';

export class ExtractAddressFromImage {
  constructor(private readonly extractor: AddressExtractor) {}

  execute(imageBase64: string): Promise<ExtractedAddressQuery> {
    return this.extractor.extract(imageBase64);
  }
}
