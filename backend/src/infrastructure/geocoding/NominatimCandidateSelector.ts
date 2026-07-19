import type { Coordinates } from '../../domain/Coordinates.js';
import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';
import type { GeocodeMatchedAddress, GeocodeResult } from '../../domain/Geocoder.js';
import { normalizeForComparison, normalizeLocalityName, normalizeProvinceName } from '../../domain/normalizeAddress.js';

export interface NominatimAddressDetails {
  road?: string;
  house_number?: string;
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

export interface NominatimCandidate {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddressDetails;
  importance?: number;
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

export function getBestLocality(address: NominatimAddressDetails | undefined): string | undefined {
  if (!address) {
    return undefined;
  }

  for (const field of LOCALITY_FIELDS) {
    const value = address[field];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

type ProvinceSignal = 'match' | 'missing';
type LocalitySignal = 'match' | 'missing' | 'mismatch';

interface CandidateEvaluation {
  index: number;
  candidate: NominatimCandidate;
  coordinates: Coordinates;
  countryOk: boolean;
  provinceConflict: boolean;
  provinceSignal: ProvinceSignal;
  localitySignal: LocalitySignal;
  bestLocality: string | undefined;
  hasRoad: boolean;
  hasHouseNumber: boolean;
  importance: number;
  score: number;
}

function evaluateCandidate(candidate: NominatimCandidate, address: DeliveryAddress, index: number): CandidateEvaluation | null {
  const lat = Number(candidate.lat);
  const lon = Number(candidate.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const candidateAddress = candidate.address;
  const countryOk = candidateAddress?.country_code?.toLowerCase() === 'ar';
  const bestLocality = getBestLocality(candidateAddress);
  const hasRoad = Boolean(candidateAddress?.road);
  const hasHouseNumber = Boolean(candidateAddress?.house_number);

  let provinceConflict = false;
  let provinceSignal: ProvinceSignal = 'missing';

  if (address.province) {
    const candidateState = candidateAddress?.state;
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

  let score = 0;
  if (provinceSignal === 'match') {
    score += 100;
  }
  if (localitySignal === 'match') {
    score += 50;
  } else if (localitySignal === 'mismatch') {
    score -= 20;
  }
  if (hasRoad) {
    score += 15;
  }
  if (hasHouseNumber) {
    score += 25;
  }

  return {
    index,
    candidate,
    coordinates: { latitude: lat, longitude: lon },
    countryOk,
    provinceConflict,
    provinceSignal,
    localitySignal,
    bestLocality,
    hasRoad,
    hasHouseNumber,
    importance: typeof candidate.importance === 'number' ? candidate.importance : 0,
    score,
  };
}

function buildMatchedAddress(candidate: NominatimCandidate): GeocodeMatchedAddress | undefined {
  const candidateAddress = candidate.address;

  if (!candidateAddress) {
    return undefined;
  }

  return {
    locality: getBestLocality(candidateAddress),
    province: candidateAddress.state,
    postalCode: candidateAddress.postcode,
    displayName: candidate.display_name,
  };
}

function logCandidate(evaluation: CandidateEvaluation): void {
  const { candidate, coordinates, countryOk, provinceConflict, provinceSignal, localitySignal, bestLocality, hasRoad, hasHouseNumber } =
    evaluation;

  console.log('[Geocoder] candidato', {
    display_name: candidate.display_name,
    lat: coordinates.latitude,
    lon: coordinates.longitude,
    pais: candidate.address?.country_code,
    provincia: candidate.address?.state,
    localidad: bestLocality,
    codigoPostal: candidate.address?.postcode,
    countryOk,
    provinceConflict,
    provinceSignal,
    localitySignal,
    hasRoad,
    hasHouseNumber,
  });
}

/**
 * Evalúa todos los candidatos que devolvió Nominatim y elige el mejor, priorizando tener
 * coordenadas navegables por sobre una coincidencia textual perfecta (RUTIA optimiza rutas y
 * navega, no valida direcciones postales). Solo descarta un candidato por completo cuando el
 * país no es Argentina o la provincia es claramente distinta a la esperada — todo lo demás
 * (código postal ausente, falta de altura, localidad en otro campo o con prefijo administrativo,
 * variaciones de texto) se usa como señal para decidir `verified` vs `ambiguous`, nunca para
 * rechazar de plano.
 */
export function selectBestCandidate(candidates: NominatimCandidate[], address: DeliveryAddress): GeocodeResult {
  console.log(`[Geocoder] candidatos recibidos: ${candidates.length}`);

  const evaluations = candidates
    .map((candidate, index) => evaluateCandidate(candidate, address, index))
    .filter((evaluation): evaluation is CandidateEvaluation => evaluation !== null);

  for (const evaluation of evaluations) {
    logCandidate(evaluation);
  }

  const arEvaluations = evaluations.filter((evaluation) => evaluation.countryOk);

  if (arEvaluations.length === 0) {
    console.log('[Geocoder] resultado: notFound — sin candidatos válidos en Argentina');
    return { status: 'notFound' };
  }

  const provinceEligible = arEvaluations.filter((evaluation) => !evaluation.provinceConflict);

  if (provinceEligible.length === 0) {
    console.log('[Geocoder] resultado: notFound — la provincia de todos los candidatos difiere de la esperada');
    return { status: 'notFound' };
  }

  const sorted = [...provinceEligible].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.importance !== a.importance) {
      return b.importance - a.importance;
    }
    return a.index - b.index;
  });

  const best = sorted[0];
  const runnerUp = sorted[1];

  // "Sin forma clara de elegir uno" solo cuando el segundo mejor empata en score Y apunta a una
  // localidad distinta — si empatan pero coinciden en localidad (ej. varios tramos de la misma
  // calle en el mismo pueblo), no hay ambigüedad real: cualquiera de los dos sirve para navegar.
  const genuineTie =
    runnerUp !== undefined &&
    runnerUp.score === best.score &&
    best.bestLocality !== undefined &&
    runnerUp.bestLocality !== undefined &&
    normalizeLocalityName(best.bestLocality) !== normalizeLocalityName(runnerUp.bestLocality);

  const matchedAddress = buildMatchedAddress(best.candidate);

  let status: 'verified' | 'ambiguous';
  let reason: string;

  if (best.provinceSignal === 'missing') {
    status = 'ambiguous';
    reason = 'el candidato elegido no informa provincia';
  } else if (best.localitySignal === 'mismatch') {
    status = 'ambiguous';
    reason = 'la localidad del candidato difiere claramente de la esperada';
  } else if (!best.hasRoad && address.street) {
    status = 'ambiguous';
    reason = 'el candidato no tiene calle asociada, representa solo una zona aproximada';
  } else if (genuineTie) {
    status = 'ambiguous';
    reason = 'hay varios candidatos razonables (distinta localidad) sin forma clara de elegir uno';
  } else {
    status = 'verified';
    reason = best.hasHouseNumber
      ? 'coordenadas, provincia, localidad y altura coinciden'
      : 'coordenadas, provincia y localidad coinciden; sin altura pero con calle identificada';
  }

  console.log(`[Geocoder] resultado: ${status} — ${reason}`, {
    seleccionado: best.candidate.display_name,
    lat: best.coordinates.latitude,
    lon: best.coordinates.longitude,
  });

  if (status === 'verified') {
    return { status: 'verified', coordinates: best.coordinates, matchedAddress };
  }

  return { status: 'ambiguous', coordinates: best.coordinates, matchedAddress, candidates: provinceEligible.length };
}
