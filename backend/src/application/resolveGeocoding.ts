import type { Coordinates } from '../domain/Coordinates.js';
import type { DeliveryAddress } from '../domain/DeliveryAddress.js';
import type { Geocoder } from '../domain/Geocoder.js';
import { GeocodingStatus } from '../domain/GeocodingStatus.js';

export interface GeocodingResolution {
  coordinates?: Coordinates;
  geocodingStatus: GeocodingStatus;
}

/**
 * Geocodifica una dirección y traduce el resultado (o un error temporal del proveedor) al par
 * `coordinates`/`geocodingStatus` que usa el resto del dominio. Compartida entre `OptimizeRoute`
 * (geocodificación en lote) y `GeocodeDeliveryAddress` (reintento manual de una sola entrega) para
 * no duplicar esta traducción en los dos lugares.
 */
export async function resolveGeocoding(geocoder: Geocoder, address: DeliveryAddress): Promise<GeocodingResolution> {
  try {
    const result = await geocoder.geocode(address);

    if (result.status === 'verified') {
      return { coordinates: result.coordinates, geocodingStatus: GeocodingStatus.Verified };
    }

    if (result.status === 'ambiguous') {
      // Conserva las coordenadas aunque queden marcadas para revisión: siguen sin usarse para
      // ordenar la ruta (solo entra al optimizador lo `Verified`), pero le dan al chofer un punto
      // navegable en vez de nada mientras decide si confiar en él.
      return { coordinates: result.coordinates, geocodingStatus: GeocodingStatus.Ambiguous };
    }

    return { geocodingStatus: GeocodingStatus.NotFound };
  } catch (error) {
    // Error temporal del proveedor (red, rate limit, respuesta inválida): no es lo mismo que "no
    // encontrado". Se deja en Pending para reintentar, no como un resultado definitivo.
    console.error('Error temporal al geocodificar una dirección', error);
    return { geocodingStatus: GeocodingStatus.Pending };
  }
}
