import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';
import { formatFullAddress, hasStructuredAddress } from '../../domain/formatDeliveryAddress.js';
import type { GeocodeResult, Geocoder } from '../../domain/Geocoder.js';
import { type NominatimCandidate, selectBestCandidate } from './NominatimCandidateSelector.js';

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 10000;
const CANDIDATE_LIMIT = 5;
const USER_AGENT = 'RUTIA/1.0 (delivery route optimization)';

export class NominatimGeocoder implements Geocoder {
  async geocode(address: DeliveryAddress): Promise<GeocodeResult> {
    const url = buildSearchUrl(address);
    console.log(`[Geocoder] dirección enviada a Nominatim: ${url.toString()}`);

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Nominatim respondió ${response.status} al geocodificar la dirección.`);
    }

    const candidates = (await response.json()) as unknown;

    if (!Array.isArray(candidates)) {
      throw new Error('Nominatim devolvió una respuesta con formato inesperado.');
    }

    return selectBestCandidate(candidates as NominatimCandidate[], address);
  }
}

/**
 * Prioriza parámetros estructurados (street/city/state/postalcode) cuando la dirección tiene
 * suficiente información propia; si no (ej. un destino de texto libre escrito a mano), cae a
 * búsqueda de texto libre — misma lógica de `hasStructuredAddress` que ya usa el resto del
 * dominio para decidir cuándo confiar en los campos separados.
 */
// "Calle" es un rótulo genérico ("street" en español) que en Argentina casi nunca forma parte
// del nombre real de la vía en los datos de OpenStreetMap (a diferencia de "Avenida"/"Ruta"/
// "Bulevar", que sí suelen serlo) — incluirlo en el parámetro estructurado `street=` de Nominatim
// hace que no matchee ningún resultado. Confirmado con un caso real: "Calle Alvar Núñez Cabeza
// de Vaca 1351" da notFound; "Alvar Núñez Cabeza de Vaca 1351" (misma calle, sin "Calle") matchea
// exacto. Se limpia acá como red de seguridad, sea que venga así de Gemini o que el repartidor lo
// haya tipeado igual al editar el campo Calle a mano.
const GENERIC_STREET_PREFIX = /^calle\s+/i;

function cleanStreetForStructuredQuery(street: string): string {
  return street.replace(GENERIC_STREET_PREFIX, '').trim();
}

function buildSearchUrl(address: DeliveryAddress): URL {
  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', String(CANDIDATE_LIMIT));
  url.searchParams.set('countrycodes', 'ar');

  if (hasStructuredAddress(address)) {
    const street = [cleanStreetForStructuredQuery(address.street), address.streetNumber].filter(Boolean).join(' ').trim();
    if (street) {
      url.searchParams.set('street', street);
    }
    if (address.locality) {
      url.searchParams.set('city', address.locality);
    }
    if (address.province) {
      url.searchParams.set('state', address.province);
    }
    if (address.postalCode) {
      url.searchParams.set('postalcode', address.postalCode);
    }
    url.searchParams.set('country', address.country || 'Argentina');
  } else {
    url.searchParams.set('q', address.rawAddress || formatFullAddress(address));
  }

  return url;
}
