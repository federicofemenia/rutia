import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';
import { formatFullAddress, hasStructuredAddress } from '../../domain/formatDeliveryAddress.js';
import type { GeocodeResult, Geocoder } from '../../domain/Geocoder.js';
import { type NominatimCandidate, selectBestCandidate } from './NominatimCandidateSelector.js';

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 10000;
const CANDIDATE_LIMIT = 5;

// La política de uso de Nominatim (operations.osmfoundation.org/policies/nominatim) pide un
// contacto real en el User-Agent (o en el parámetro `email`) para poder avisar antes de
// bloquear, en vez de bloquear directo — por eso va acá, no solo un nombre de app.
const CONTACT_EMAIL = 'femenia.f@gmail.com';
const USER_AGENT = `RUTIA/1.0 (delivery route optimization; ${CONTACT_EMAIL})`;

// Nominatim es un servicio público compartido: un 429 (rate limit) o un error de red puntual son
// esperables bajo uso normal, no excepcionales. Un solo reintento con backoff simple alcanza para
// un MVP — nada de reintentos infinitos ni backoff exponencial. Si el segundo intento también
// falla, se deja subir el error: quien geocodifica (OptimizeRoute, o el reintento manual de una
// entrega) ya sabe tratarlo como temporal, no hace falta resolverlo acá.
const DEFAULT_BACKOFF_MS = 1500;
const MAX_RETRY_AFTER_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// `Retry-After` puede venir como segundos (ej. "2") o como fecha HTTP — Nominatim documenta el
// primer formato, pero el header es estándar y podría llegar en cualquiera de los dos.
function parseRetryAfterMs(header: string | null): number | null {
  if (!header) {
    return null;
  }

  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const dateMs = Date.parse(header);
  return Number.isNaN(dateMs) ? null : Math.max(0, dateMs - Date.now());
}

interface FetchAttempt {
  response?: Response;
  error?: unknown;
  retryAfterMs: number | null;
}

async function attemptFetch(url: URL, attempt: 1 | 2): Promise<FetchAttempt> {
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const elapsedMs = Date.now() - startedAt;
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
    const retrySuffix = retryAfterHeader ? ` (Retry-After: ${retryAfterHeader})` : '';

    if (response.ok) {
      console.log(`[Geocoder] intento ${attempt}: ${response.status} en ${elapsedMs}ms`);
    } else {
      console.error(`[Geocoder] intento ${attempt}: ${response.status} en ${elapsedMs}ms${retrySuffix}`);
    }

    return { response, retryAfterMs };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[Geocoder] intento ${attempt}: error de red en ${elapsedMs}ms — ${reason}`);
    return { error, retryAfterMs: null };
  }
}

async function fetchWithSingleRetry(url: URL): Promise<Response> {
  const first = await attemptFetch(url, 1);
  if (first.response?.ok) {
    return first.response;
  }

  const waitMs = first.retryAfterMs !== null ? Math.min(first.retryAfterMs, MAX_RETRY_AFTER_MS) : DEFAULT_BACKOFF_MS;
  await sleep(waitMs);

  const second = await attemptFetch(url, 2);
  if (second.response?.ok) {
    return second.response;
  }

  if (second.response) {
    throw new Error(`Nominatim respondió ${second.response.status} al geocodificar la dirección.`);
  }
  throw second.error instanceof Error ? second.error : new Error('No se pudo conectar con Nominatim.');
}

export class NominatimGeocoder implements Geocoder {
  async geocode(address: DeliveryAddress): Promise<GeocodeResult> {
    const url = buildSearchUrl(address);
    console.log(`[Geocoder] dirección enviada a Nominatim: ${url.toString()}`);

    const response = await fetchWithSingleRetry(url);
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
  url.searchParams.set('email', CONTACT_EMAIL);

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
