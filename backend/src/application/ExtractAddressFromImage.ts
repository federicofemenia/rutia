import type { AddressExtractor } from '../domain/AddressExtractor.js';
import type { DeliveryAddress } from '../domain/DeliveryAddress.js';

export class ExtractAddressFromImage {
  constructor(private readonly extractor: AddressExtractor) {}

  execute(imageBase64: string): Promise<DeliveryAddress> {
    return this.extractor.extract(imageBase64);
  }
}
