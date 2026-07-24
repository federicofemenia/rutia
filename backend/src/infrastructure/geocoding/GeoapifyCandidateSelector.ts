import type { Coordinates } from '../../domain/Coordinates.js';
import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';
import type { GeocodeMatchedAddress, GeocodeResult } from '../../domain/Geocoder.js';
import { normalizeForComparison, normalizeLocalityName, normalizePostalCode, normalizeProvinceName } from '../../domain/normalizeAddress.js';

export interface GeoapifyRank {
  confidence?: number;
}

export interface GeoapifyResult {
  lat?: number;
  lon?: number;
  country_code?: string;
  state?: string;
  county?: string;
  city?: string;
  suburb?: string;
  postcode?: string;
  street?: string;
  housenumber?: string;
  formatted?: string;
  rank?: GeoapifyRank;
}

// Geoapify tampoco usa siempre el mismo campo para "localidad" — `city` es lo habitual, pero a
// veces solo viene el partido/departamento (`county`) o el barrio (`suburb`). Misma estrategia
// que se usaba con Nominatim: probar todos los candidatos razonables en vez de asumir uno fijo.
const LOCALITY_FIELDS: Array<keyof GeoapifyResult> = ['city', 'county', 'suburb'];

export function getBestLocality(result: GeoapifyResult): string | undefined {
  for (const field of LOCALITY_FIELDS) {
    const value = result[field];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

type ProvinceSignal = 'match' | 'missing';
type LocalitySignal = 'match' | 'missing' | 'mismatch';
type PostalCodeSignal = 'match' | 'missing' | 'mismatch';

interface ResultEvaluation {
  index: number;
  result: GeoapifyResult;
  coordinates: Coordinates;
  countryOk: boolean;
  provinceConflict: boolean;
  provinceSignal: ProvinceSignal;
  localitySignal: LocalitySignal;
  postalCodeSignal: PostalCodeSignal;
  bestLocality: string | undefined;
  hasRoad: boolean;
  hasHouseNumber: boolean;
  confidence: number;
  score: number;
}

function evaluateResult(result: GeoapifyResult, address: DeliveryAddress, index: number): ResultEvaluation | null {
  const { lat, lon } = result;

  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const countryOk = result.country_code?.toLowerCase() === 'ar';
  const bestLocality = getBestLocality(result);
  const hasRoad = Boolean(result.street);
  const hasHouseNumber = Boolean(result.housenumber);

  let provinceConflict = false;
  let provinceSignal: ProvinceSignal = 'missing';

  if (address.province) {
    const candidateState = result.state;
    if (candidateState) {
      const expected = normalizeForComparison(normalizeProvinceName(address.province));
      const actual = normalizeForComparison(normalizeProvinceName(candidateState));
      if (actual === expected) {
        provinceSignal = 'match';
      } else {
        provinceConflict = true;
      }
    }
  }

  let localitySignal: LocalitySignal = 'missing';

  if (address.locality && bestLocality) {
    const expected = normalizeLocalityName(address.locality);
    const actual = normalizeLocalityName(bestLocality);
    localitySignal = actual.includes(expected) || expected.includes(actual) ? 'match' : 'mismatch';
  }

  // El código postal argentino tradicional (4 dígitos, ej. "1722") queda contenido dentro del CPA
  // alfanumérico que suelen devolver los geocoders (ej. "B1722ERH" = letra de provincia + esos
  // mismos 4 dígitos + sufijo) — por eso se compara por inclusión, igual que provincia/localidad,
  // en vez de exigir una igualdad exacta de formato.
  let postalCodeSignal: PostalCodeSignal = 'missing';

  if (address.postalCode && result.postcode) {
    const expected = normalizePostalCode(address.postalCode);
    const actual = normalizePostalCode(result.postcode);
    if (expected && actual) {
      postalCodeSignal = actual.includes(expected) || expected.includes(actual) ? 'match' : 'mismatch';
    }
  }

  let score = 0;
  if (provinceSignal === 'match') {
    score += 100;
  }
  if (localitySignal === 'match') {
    score += 50;
  } else if (localitySignal === 'mismatch') {
    score -= 20;
  }
  if (postalCodeSignal === 'match') {
    // Entre candidatos ya empatados en provincia/localidad/calle/altura (ej. varios tramos de la
    // misma calle en distintos barrios de un mismo partido), el código postal es la señal que
    // realmente distingue cuál es el correcto — sin este puntaje, ganaba el primero que devolvía
    // la API sin importar si su CP coincidía con el que se pidió.
    score += 20;
  } else if (postalCodeSignal === 'mismatch') {
    score -= 10;
  }
  if (hasRoad) {
    score += 15;
  }
  if (hasHouseNumber) {
    score += 25;
  }

  return {
    index,
    result,
    coordinates: { latitude: lat, longitude: lon },
    countryOk,
    provinceConflict,
    provinceSignal,
    localitySignal,
    postalCodeSignal,
    bestLocality,
    hasRoad,
    hasHouseNumber,
    confidence: typeof result.rank?.confidence === 'number' ? result.rank.confidence : 0,
    score,
  };
}

function buildMatchedAddress(result: GeoapifyResult): GeocodeMatchedAddress | undefined {
  return {
    locality: getBestLocality(result),
    province: result.state,
    postalCode: result.postcode,
    displayName: result.formatted,
  };
}

function logEvaluation(evaluation: ResultEvaluation): void {
  const {
    result,
    coordinates,
    countryOk,
    provinceConflict,
    provinceSignal,
    localitySignal,
    postalCodeSignal,
    bestLocality,
    hasRoad,
    hasHouseNumber,
    confidence,
    score,
  } = evaluation;

  console.log('[Geocoder] resultado candidato', {
    formatted: result.formatted,
    lat: coordinates.latitude,
    lon: coordinates.longitude,
    pais: result.country_code,
    provincia: result.state,
    localidad: bestLocality,
    codigoPostal: result.postcode,
    countryOk,
    provinceConflict,
    provinceSignal,
    localitySignal,
    postalCodeSignal,
    hasRoad,
    hasHouseNumber,
    confidence,
    score,
  });
}

/**
 * Misma lógica de decisión que se usaba con Nominatim (`NominatimCandidateSelector`, eliminado):
 * prioriza tener coordenadas navegables por sobre una coincidencia textual perfecta. Solo
 * descarta un resultado por completo cuando el país no es Argentina o la provincia es
 * claramente distinta a la esperada — todo lo demás (código postal ausente, falta de altura,
 * localidad en otro campo o con prefijo administrativo) es señal para `verified` vs `ambiguous`,
 * nunca motivo de rechazo directo.
 */
export function selectBestGeoapifyResult(results: GeoapifyResult[], address: DeliveryAddress): GeocodeResult {
  console.log(`[Geocoder] resultados recibidos: ${results.length}`);

  const evaluations = results
    .map((result, index) => evaluateResult(result, address, index))
    .filter((evaluation): evaluation is ResultEvaluation => evaluation !== null);

  for (const evaluation of evaluations) {
    logEvaluation(evaluation);
  }

  const arEvaluations = evaluations.filter((evaluation) => evaluation.countryOk);

  if (arEvaluations.length === 0) {
    console.log('[Geocoder] estado final: notFound — sin resultados válidos en Argentina');
    return { status: 'notFound' };
  }

  const provinceEligible = arEvaluations.filter((evaluation) => !evaluation.provinceConflict);

  if (provinceEligible.length === 0) {
    console.log('[Geocoder] estado final: notFound — la provincia de todos los resultados difiere de la esperada');
    return { status: 'notFound' };
  }

  const sorted = [...provinceEligible].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return a.index - b.index;
  });

  const best = sorted[0];
  const runnerUp = sorted[1];

  // "Sin forma clara de elegir uno" solo cuando el segundo mejor empata en score Y apunta a una
  // localidad distinta — si empatan pero coinciden en localidad, cualquiera de los dos sirve.
  const genuineTie =
    runnerUp !== undefined &&
    runnerUp.score === best.score &&
    best.bestLocality !== undefined &&
    runnerUp.bestLocality !== undefined &&
    normalizeLocalityName(best.bestLocality) !== normalizeLocalityName(runnerUp.bestLocality);

  const matchedAddress = buildMatchedAddress(best.result);

  let status: 'verified' | 'ambiguous';
  let reason: string;

  if (best.provinceSignal === 'missing') {
    status = 'ambiguous';
    reason = 'el resultado elegido no informa provincia';
  } else if (best.localitySignal === 'mismatch') {
    status = 'ambiguous';
    reason = 'la localidad del resultado difiere claramente de la esperada';
  } else if (!best.hasRoad && address.street) {
    status = 'ambiguous';
    reason = 'el resultado no tiene calle asociada, representa solo una zona aproximada';
  } else if (genuineTie) {
    status = 'ambiguous';
    reason = 'hay varios resultados razonables (distinta localidad) sin forma clara de elegir uno';
  } else {
    status = 'verified';
    reason = best.hasHouseNumber
      ? 'coordenadas, provincia, localidad y altura coinciden'
      : 'coordenadas, provincia y localidad coinciden; sin altura pero con calle identificada';
  }

  console.log(`[Geocoder] estado final: ${status} — ${reason}`, {
    seleccionado: best.result.formatted,
    lat: best.coordinates.latitude,
    lon: best.coordinates.longitude,
  });

  if (status === 'verified') {
    return { status: 'verified', coordinates: best.coordinates, matchedAddress };
  }

  return { status: 'ambiguous', coordinates: best.coordinates, matchedAddress, candidates: provinceEligible.length };
}
