import type { DeliveryAddress } from './DeliveryAddress.js';

export interface AddressExtractor {
  extract(imageBase64: string): Promise<DeliveryAddress>;
}
