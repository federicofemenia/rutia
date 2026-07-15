import type { Coordinates } from '../../domain/Coordinates.js';
import type { Geocoder } from '../../domain/Geocoder.js';

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 10000;

interface NominatimResult {
  lat: string;
  lon: string;
}

export class NominatimGeocoder implements Geocoder {
  async geocode(address: string): Promise<Coordinates> {
    const url = new URL(NOMINATIM_SEARCH_URL);
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'ar');

    const response = await fetch(url, {
      headers: { 'User-Agent': 'RUTIA/1.0 (delivery route optimization)' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Nominatim respondió ${response.status} al geocodificar "${address}"`);
    }

    const results = (await response.json()) as NominatimResult[];
    const [result] = results;

    if (!result) {
      throw new Error(`No se encontraron coordenadas para "${address}"`);
    }

    return { latitude: Number(result.lat), longitude: Number(result.lon) };
  }
}
