import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';
import { formatFullAddress, hasStructuredAddress } from '../../domain/formatDeliveryAddress.js';
import type { GeocodeMatchedAddress, GeocodeResult, Geocoder } from '../../domain/Geocoder.js';
import { normalizeForComparison, normalizeProvinceName } from '../../domain/normalizeAddress.js';

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 10000;
const CANDIDATE_LIMIT = 5;
const USER_AGENT = 'RUTIA/1.0 (delivery route optimization)';

interface NominatimAddressDetails {
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  city_district?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
}

interface NominatimCandidate {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddressDetails;
}

// Nominatim no siempre usa el mismo campo para "localidad" — depende de si es una ciudad
// grande, un barrio porteño, un municipio del conurbano, etc. Probamos todos los candidatos
// razonables en vez de asumir uno fijo.
const LOCALITY_FIELDS: Array<keyof NominatimAddressDetails> = [
  'city',
  'town',
  'village',
  'municipality',
  'suburb',
  'city_district',
  'county',
];

export class NominatimGeocoder implements Geocoder {
  async geocode(address: DeliveryAddress): Promise<GeocodeResult> {
    const url = buildSearchUrl(address);

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

function selectBestCandidate(candidates: NominatimCandidate[], address: DeliveryAddress): GeocodeResult {
  const consistent = candidates.filter((candidate) => isConsistentCandidate(candidate, address));

  if (consistent.length === 0) {
    return { status: 'notFound' };
  }

  // Coincidir solo por provincia no alcanza para confirmar una dirección: sin localidad, un
  // único candidato consistente puede seguir siendo el lugar equivocado dentro de la provincia
  // (ver caso "Av. Rivadavia 1500, Buenos Aires" resolviendo en Junín). Sin `locality` para
  // contrastar, nunca se devuelve `verified`, aunque quede un solo candidato tras los filtros.
  if (consistent.length > 1 || !address.locality) {
    return { status: 'ambiguous', candidates: consistent.length };
  }

  const [candidate] = consistent;

  return {
    status: 'verified',
    coordinates: { latitude: Number(candidate.lat), longitude: Number(candidate.lon) },
    matchedAddress: buildMatchedAddress(candidate),
  };
}

function isConsistentCandidate(candidate: NominatimCandidate, address: DeliveryAddress): boolean {
  const candidateAddress = candidate.address;

  if (!candidateAddress || candidateAddress.country_code?.toLowerCase() !== 'ar') {
    return false;
  }

  if (address.province) {
    const expectedProvince = normalizeForComparison(normalizeProvinceName(address.province));
    const candidateProvince = candidateAddress.state ? normalizeForComparison(normalizeProvinceName(candidateAddress.state)) : undefined;

    if (candidateProvince !== expectedProvince) {
      return false;
    }
  }

  if (address.locality) {
    const expectedLocality = normalizeForComparison(address.locality);
    const matchesLocality = LOCALITY_FIELDS.some((field) => {
      const value = candidateAddress[field];
      if (typeof value !== 'string') {
        return false;
      }
      // "Contiene" en vez de igualdad estricta: en los datos de Nominatim, muchas localidades
      // argentinas aparecen con prefijos administrativos que nuestro campo no tiene (ej. "San
      // Martín" (Mendoza) figura como "Distrito Ciudad de San Martín") — exigir igualdad exacta
      // rechazaría coincidencias correctas. Sigue restringido a los campos de localidad, así que
      // no se compara contra texto no relacionado (calles, barrios sueltos, etc.).
      const candidateLocality = normalizeForComparison(value);
      return candidateLocality.includes(expectedLocality) || expectedLocality.includes(candidateLocality);
    });

    if (!matchesLocality) {
      return false;
    }
  }

  if (address.street && !candidateAddress.road) {
    // Pedimos una calle puntual, pero el resultado es un centroide (ciudad/provincia/CP) sin
    // calle asociada — no es una dirección exacta, no lo aceptamos como si lo fuera.
    return false;
  }

  return true;
}

function buildMatchedAddress(candidate: NominatimCandidate): GeocodeMatchedAddress | undefined {
  const candidateAddress = candidate.address;

  if (!candidateAddress) {
    return undefined;
  }

  const locality = LOCALITY_FIELDS.map((field) => candidateAddress[field]).find(
    (value): value is string => typeof value === 'string',
  );

  return {
    locality,
    province: candidateAddress.state,
    postalCode: candidateAddress.postcode,
    displayName: candidate.display_name,
  };
}
