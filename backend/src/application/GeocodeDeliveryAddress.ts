import type { DeliveryAddress } from '../domain/DeliveryAddress.js';
import type { Geocoder } from '../domain/Geocoder.js';
import { type GeocodingResolution, resolveGeocoding } from './resolveGeocoding.js';

/**
 * Reintenta la geocodificación de una única dirección — usado por el botón "Ubicar nuevamente"
 * cuando una entrega quedó `NotFound`/`Ambiguous`/`Pending`. A diferencia de `OptimizeRoute`, acá
 * no hay lote ni pacing entre llamadas: es una sola dirección, una sola consulta.
 */
export class GeocodeDeliveryAddress {
  constructor(private readonly geocoder: Geocoder) {}

  execute(address: DeliveryAddress): Promise<GeocodingResolution> {
    return resolveGeocoding(this.geocoder, address);
  }
}
