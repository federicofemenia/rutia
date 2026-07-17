import {
  DeliveryStatus,
  FailureReasonCode,
  GeocodingStatus,
  type Coordinates,
  type Delivery,
  type DeliveryAddress,
  type RouteSession,
} from '../../route';

const DEFAULT_COUNTRY = 'Argentina';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCoordinates(value: unknown): value is Coordinates {
  return isRecord(value) && typeof value.latitude === 'number' && typeof value.longitude === 'number';
}

function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return typeof value === 'string' && (Object.values(DeliveryStatus) as string[]).includes(value);
}

function isFailureReasonCode(value: unknown): value is FailureReasonCode {
  return typeof value === 'string' && (Object.values(FailureReasonCode) as string[]).includes(value);
}

function isGeocodingStatus(value: unknown): value is GeocodingStatus {
  return typeof value === 'string' && (Object.values(GeocodingStatus) as string[]).includes(value);
}

/**
 * `rawAddress` puede venir como string plano (formato legacy, versión 1: `delivery.address`
 * era texto libre y `delivery.postalCode` vivía aparte) o ya como objeto estructurado
 * (formato actual, posiblemente incompleto por datos corruptos). En ambos casos se reconstruye
 * de forma defensiva — nunca se lanza una excepción por campos faltantes.
 */
function migrateDeliveryAddress(rawDelivery: Record<string, unknown>): DeliveryAddress {
  const rawAddress = rawDelivery.address;

  if (typeof rawAddress === 'string') {
    const legacyPostalCode = typeof rawDelivery.postalCode === 'string' ? rawDelivery.postalCode.trim() : '';

    return {
      street: rawAddress,
      postalCode: legacyPostalCode.length > 0 ? legacyPostalCode : undefined,
      locality: '',
      province: '',
      country: DEFAULT_COUNTRY,
      rawAddress,
    };
  }

  if (isRecord(rawAddress)) {
    return {
      street: typeof rawAddress.street === 'string' ? rawAddress.street : '',
      streetNumber: typeof rawAddress.streetNumber === 'string' ? rawAddress.streetNumber : undefined,
      postalCode: typeof rawAddress.postalCode === 'string' ? rawAddress.postalCode : undefined,
      locality: typeof rawAddress.locality === 'string' ? rawAddress.locality : '',
      province: typeof rawAddress.province === 'string' ? rawAddress.province : '',
      country: typeof rawAddress.country === 'string' && rawAddress.country ? rawAddress.country : DEFAULT_COUNTRY,
      rawAddress: typeof rawAddress.rawAddress === 'string' ? rawAddress.rawAddress : undefined,
    };
  }

  return { street: '', locality: '', province: '', country: DEFAULT_COUNTRY };
}

/**
 * Reconstruye una entrega de forma defensiva. Solo descarta la entrega puntual (no la sesión
 * completa) cuando falta la identidad mínima (`id`/`createdAt`) necesaria para operar con ella.
 */
function migrateDelivery(raw: unknown): Delivery | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.createdAt !== 'string') {
    return null;
  }

  const coordinates = isCoordinates(raw.coordinates) ? raw.coordinates : undefined;

  // Si la entrega ya trae un geocodingStatus válido (formato actual — incluye 'ambiguous' y
  // 'notFound', que no dependen de tener coordinates), se conserva tal cual: recalcularlo solo
  // a partir de `coordinates` pisaría esos estados en cada `load()`, ya que ninguno de los dos
  // tiene coordinates. Solo se infiere cuando falta (formato legacy v1, que nunca tuvo este
  // campo) — ahí las coordenadas migradas se conservan por compatibilidad, pero no fueron
  // validadas con el algoritmo de geocodificación estructurada nuevo.
  const geocodingStatus = isGeocodingStatus(raw.geocodingStatus)
    ? raw.geocodingStatus
    : coordinates
      ? GeocodingStatus.Verified
      : GeocodingStatus.Pending;

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    address: migrateDeliveryAddress(raw),
    coordinates,
    geocodingStatus,
    status: isDeliveryStatus(raw.status) ? raw.status : DeliveryStatus.Pending,
    deliveredAt: typeof raw.deliveredAt === 'string' ? raw.deliveredAt : undefined,
    failureReasonCode: isFailureReasonCode(raw.failureReasonCode) ? raw.failureReasonCode : undefined,
    failureReasonDetail: typeof raw.failureReasonDetail === 'string' ? raw.failureReasonDetail : undefined,
  };
}

export interface MigratedRouteSession {
  session: RouteSession;
  /** true si se detectó y transformó al menos una entrega en formato legacy (address string). */
  wasLegacy: boolean;
}

/**
 * Reconstruye una `RouteSession` persistida, sea del formato legacy (v1, `address` como string)
 * o del formato actual (posiblemente incompleto). La detección del formato legacy se hace por
 * entrega, inspeccionando el tipo real de `address` — no depende únicamente del número de
 * versión del registro persistido. Devuelve `null` solo cuando la estructura de nivel sesión
 * (id/fechas/lista de entregas) es irreconocible; en ese caso el llamador debe descartarla.
 */
export function migratePersistedRouteSession(raw: unknown): MigratedRouteSession | null {
  if (
    !isRecord(raw) ||
    typeof raw.id !== 'string' ||
    typeof raw.createdAt !== 'string' ||
    typeof raw.updatedAt !== 'string' ||
    !Array.isArray(raw.deliveries)
  ) {
    return null;
  }

  const wasLegacy = raw.deliveries.some((entry) => isRecord(entry) && typeof entry.address === 'string');

  const deliveries = raw.deliveries
    .map((entry) => migrateDelivery(entry))
    .filter((delivery): delivery is Delivery => delivery !== null);

  return {
    session: {
      id: raw.id,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
      deliveries,
    },
    wasLegacy,
  };
}
