import type { Coordinates } from './Coordinates.js';
import type { DeliveryAddress } from './DeliveryAddress.js';

export interface GeocodeMatchedAddress {
  locality?: string;
  province?: string;
  postalCode?: string;
  displayName?: string;
}

export interface GeocodeCandidateOption {
  coordinates: Coordinates;
  /** Texto para que el chofer distinga una opción de otra (ej. el barrio de cada una). */
  label: string;
}

export type GeocodeResult =
  | { status: 'verified'; coordinates: Coordinates; matchedAddress?: GeocodeMatchedAddress }
  // Un resultado ambiguo puede seguir trayendo coordenadas: RUTIA prioriza tener un punto
  // navegable (aunque requiera revisión) por sobre no tener nada — el chofer decide si confiar
  // en él o corregir la dirección a mano.
  // `options`: presente solo cuando hay más de un candidato empatado en todos los datos
  // disponibles (calle, localidad, código postal) pero con coordenadas distintas — no hay forma
  // de elegir uno automáticamente sin arriesgarse a mandar al chofer al lugar equivocado, así que
  // se le ofrecen las opciones para que elija (ver el botón "Ubicar nuevamente").
  | {
      status: 'ambiguous';
      coordinates?: Coordinates;
      matchedAddress?: GeocodeMatchedAddress;
      candidates?: number;
      options?: GeocodeCandidateOption[];
    }
  | { status: 'notFound' };

export interface Geocoder {
  geocode(address: DeliveryAddress): Promise<GeocodeResult>;
}
