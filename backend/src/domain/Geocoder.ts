import type { Coordinates } from './Coordinates.js';
import type { DeliveryAddress } from './DeliveryAddress.js';

export interface GeocodeMatchedAddress {
  locality?: string;
  province?: string;
  postalCode?: string;
  displayName?: string;
}

export type GeocodeResult =
  | { status: 'verified'; coordinates: Coordinates; matchedAddress?: GeocodeMatchedAddress }
  | { status: 'ambiguous'; candidates?: number }
  | { status: 'notFound' };

export interface Geocoder {
  geocode(address: DeliveryAddress): Promise<GeocodeResult>;
}
