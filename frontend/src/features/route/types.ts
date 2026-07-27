export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryAddress {
  street: string;
  streetNumber?: string;
  postalCode?: string;
  locality: string;
  province: string;
  country: string;
  rawAddress?: string;
  /** Id de Google Place de donde se resolvió esta dirección. */
  placeId?: string;
  /** Dirección formateada tal como la devuelve Google Place Details. */
  formattedAddress?: string;
  /** Quién resolvió las coordenadas (ej. "google-places"). Ausente en entregas viejas. */
  geocodingProvider?: string;
  /** ISO 8601, cuándo se resolvió. */
  geocodedAt?: string;
}

export const GeocodingStatus = {
  Pending: 'pending',
  Verified: 'verified',
  Ambiguous: 'ambiguous',
  NotFound: 'notFound',
} as const;

export type GeocodingStatus = (typeof GeocodingStatus)[keyof typeof GeocodingStatus];

export const DeliveryStatus = {
  Pending: 'pending',
  InProgress: 'inProgress',
  Delivered: 'delivered',
  Failed: 'failed',
} as const;

export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const FailureReasonCode = {
  CustomerAbsent: 'customerAbsent',
  WrongAddress: 'wrongAddress',
  OrderRejected: 'orderRejected',
  AddressNotFound: 'addressNotFound',
  Other: 'other',
} as const;

export type FailureReasonCode = (typeof FailureReasonCode)[keyof typeof FailureReasonCode];

export const RouteSessionStatus = {
  InProgress: 'in_progress',
  Finished: 'finished',
} as const;

export type RouteSessionStatus = (typeof RouteSessionStatus)[keyof typeof RouteSessionStatus];

export interface Delivery {
  id: string;
  address: DeliveryAddress;
  createdAt: string;
  coordinates?: Coordinates;
  geocodingStatus: GeocodingStatus;
  status: DeliveryStatus;
  deliveredAt?: string;
  failureReasonCode?: FailureReasonCode;
  failureReasonDetail?: string;
}

export interface RouteSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deliveries: Delivery[];
  status: RouteSessionStatus;
}

/** Un tramo del recorrido devuelto por Google Routes — nunca se recalcula en el frontend. */
export interface OptimizeRouteLeg {
  /** Metros. */
  distance: number;
  /** Segundos. */
  duration: number;
  /** `null` cuando el origen del tramo es el punto de partida (no una entrega). */
  fromDeliveryId: string | null;
  /** `null` cuando el destino del tramo es el destino final de la ruta (no una entrega). */
  toDeliveryId: string | null;
}

export interface OptimizeRouteSummary {
  /** Metros, recorrido completo. */
  totalDistance: number;
  /** Segundos, recorrido completo. */
  totalDuration: number;
  legs: OptimizeRouteLeg[];
  /** Geometría del recorrido (polyline codificado de Google), para dibujar la ruta real en el
   *  mapa en vez de líneas rectas entre paradas. */
  encodedPolyline?: string;
}

/** Destino final elegido por el chofer al optimizar (en vez de "terminar en mi ubicación
 *  actual"), ya resuelto vía Places — `address` es solo para mostrarlo, `coordinates` es lo que
 *  se reenvía al backend en cada recálculo automático. */
export interface CustomDestination {
  address: DeliveryAddress;
  coordinates: Coordinates;
}

/**
 * `routeSummary` que vive en `RouteContext`: además de lo que devuelve el backend, agrega
 * `hasCustomDestination` — si el chofer configuró un destino final real al optimizar (en vez de
 * "terminar en mi ubicación actual") — para que la última entrega muestre la distancia a ese
 * destino en vez de "Última entrega". Es una decisión de UI, no viene de Google Routes.
 *
 * `customDestination` guarda ese destino (solo presente cuando `hasCustomDestination` es true)
 * para poder recalcular la ruta automáticamente más adelante (nueva entrega agregada, entrega
 * eliminada) sin volver a preguntarle al chofer el destino cada vez.
 */
export interface RouteSummaryInfo extends OptimizeRouteSummary {
  hasCustomDestination: boolean;
  customDestination?: CustomDestination;
}
