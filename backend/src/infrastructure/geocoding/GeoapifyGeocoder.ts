import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';
import { formatFullAddress, hasStructuredAddress } from '../../domain/formatDeliveryAddress.js';
import type { GeocodeResult, Geocoder } from '../../domain/Geocoder.js';
import { type GeoapifyResult, selectBestGeoapifyResult } from './GeoapifyCandidateSelector.js';

const GEOAPIFY_SEARCH_URL = 'https://api.geoapify.com/v1/geocode/search';
const REQUEST_TIMEOUT_MS = 10000;
const RESULT_LIMIT = 5;

// Mismo motivo que tenía Nominatim con "Calle": en Argentina ese rótulo genérico casi nunca
// forma parte del nombre real de la vía en los datos de mapas (a diferencia de "Avenida"/"Ruta"/
// "Bulevar", que sí suelen serlo), e incluirlo en el parámetro `street=` empeora el matching.
const GENERIC_STREET_PREFIX = /^calle\s+/i;

function cleanStreetForStructuredQuery(street: string): string {
  return street.replace(GENERIC_STREET_PREFIX, '').trim();
}

function buildSearchUrl(address: DeliveryAddress, apiKey: string): URL {
  const url = new URL(GEOAPIFY_SEARCH_URL);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('lang', 'es');
  url.searchParams.set('limit', String(RESULT_LIMIT));
  // Filtro estricto por país (no solo bias): mismo comportamiento que `countrycodes=ar` tenía en
  // Nominatim, para no traer falsos positivos de otros países de habla hispana.
  url.searchParams.set('filter', 'countrycode:ar');

  if (hasStructuredAddress(address)) {
    const street = cleanStreetForStructuredQuery(address.street);
    if (street) {
      url.searchParams.set('street', street);
    }
    if (address.streetNumber) {
      url.searchParams.set('housenumber', address.streetNumber);
    }
    if (address.locality) {
      url.searchParams.set('city', address.locality);
    }
    if (address.province) {
      url.searchParams.set('state', address.province);
    }
    if (address.postalCode) {
      url.searchParams.set('postcode', address.postalCode);
    }
    url.searchParams.set('country', address.country || 'Argentina');
  } else {
    url.searchParams.set('text', address.rawAddress || formatFullAddress(address));
  }

  return url;
}

function describeAddress(address: DeliveryAddress): string {
  return hasStructuredAddress(address)
    ? [address.street, address.streetNumber, address.locality, address.province, 'Argentina'].filter(Boolean).join(', ')
    : address.rawAddress || formatFullAddress(address);
}

function redactApiKey(url: URL): string {
  const redacted = new URL(url.toString());
  if (redacted.searchParams.has('apiKey')) {
    redacted.searchParams.set('apiKey', '***');
  }
  return redacted.toString();
}

export class GeoapifyGeocoder implements Geocoder {
  constructor(private readonly apiKey: string) {}

  async geocode(address: DeliveryAddress): Promise<GeocodeResult> {
    const url = buildSearchUrl(address, this.apiKey);
    console.log(`[Geocoder] dirección buscada: ${describeAddress(address)}`);
    console.log(`[Geocoder] URL solicitada: ${redactApiKey(url)}`);

    const startedAt = Date.now();
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const elapsedMs = Date.now() - startedAt;

    if (!response.ok) {
      console.error(`[Geocoder] Geoapify respondió ${response.status} en ${elapsedMs}ms`);
      throw new Error(`Geoapify respondió ${response.status} al geocodificar la dirección.`);
    }

    const body = (await response.json()) as { results?: unknown };
    const results = Array.isArray(body.results) ? (body.results as GeoapifyResult[]) : [];
    console.log(`[Geocoder] ${results.length} resultado(s) recibido(s) en ${elapsedMs}ms`);

    return selectBestGeoapifyResult(results, address);
  }
}
