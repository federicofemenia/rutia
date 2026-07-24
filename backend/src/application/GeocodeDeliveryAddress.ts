import type { DeliveryAddress } from '../domain/DeliveryAddress.js';
import type { Geocoder } from '../domain/Geocoder.js';
import { type GeocodingResolution, resolveGeocoding } from './resolveGeocoding.js';

/**
 * Geocodifica una única dirección de texto libre contra el `Geocoder` inyectado. Desde la
 * migración a Google Places (ver docs/google-migration.md), el flujo principal resuelve
 * direcciones del lado del cliente y no llama a esta clase — queda sin wiring HTTP activo, lista
 * para un futuro caso que sí necesite geocodificar texto libre server-side (import masivo,
 * panel de administración).
 */
export class GeocodeDeliveryAddress {
  constructor(private readonly geocoder: Geocoder) {}

  execute(address: DeliveryAddress): Promise<GeocodingResolution> {
    return resolveGeocoding(this.geocoder, address);
  }
}
