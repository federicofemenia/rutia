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
  // Un resultado ambiguo puede seguir trayendo coordenadas: RUTIA prioriza tener un punto
  // navegable (aunque requiera revisión) por sobre no tener nada — el chofer decide si confiar
  // en él o corregir la dirección a mano.
  | { status: 'ambiguous'; coordinates?: Coordinates; matchedAddress?: GeocodeMatchedAddress; candidates?: number }
  | { status: 'notFound' };

export interface Geocoder {
  geocode(address: DeliveryAddress): Promise<GeocodeResult>;
}
