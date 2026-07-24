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
}

/**
 * Una de varias ubicaciones empatadas para la misma dirección (misma calle/localidad/código
 * postal, pero coordenadas distintas) — el backend no puede elegir una sola con confianza, así
 * que se le ofrecen al chofer para que elija.
 */
export interface GeocodeCandidateOption {
  coordinates: Coordinates;
  label: string;
}

/** Un tramo del recorrido devuelto por OSRM — nunca se recalcula en el frontend. */
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
}

/**
 * `routeSummary` que vive en `RouteContext`: además de lo que devuelve el backend, agrega
 * `hasCustomDestination` — si el chofer configuró una dirección final real al optimizar (en vez
 * de "terminar en mi ubicación actual") — para que la última entrega muestre la distancia a ese
 * destino en vez de "Última entrega". Es una decisión de UI, no viene de OSRM.
 *
 * `customDestinationAddress` guarda esa dirección (solo presente cuando `hasCustomDestination` es
 * true) para poder recalcular la ruta automáticamente más adelante (nueva entrega agregada,
 * "Ubicar nuevamente" resuelto) sin volver a preguntarle al chofer el destino cada vez.
 */
export interface RouteSummaryInfo extends OptimizeRouteSummary {
  hasCustomDestination: boolean;
  customDestinationAddress?: DeliveryAddress;
}
