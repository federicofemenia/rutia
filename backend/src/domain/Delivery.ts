import type { Coordinates } from './Coordinates.js';
import type { DeliveryAddress } from './DeliveryAddress.js';
import type { DeliveryStatus } from './DeliveryStatus.js';
import type { FailureReasonCode } from './FailureReasonCode.js';
import type { GeocodingStatus } from './GeocodingStatus.js';

export interface Delivery {
  id: string;
  address: DeliveryAddress;
  createdAt: string;
  coordinates?: Coordinates;
  geocodingStatus: GeocodingStatus;
  // Ciclo de vida de la entrega: opcionales acá porque una entrega recién creada en el frontend
  // (o un destino final construido ad-hoc) puede no tenerlos, pero una RouteSession persistida
  // siempre los trae. OptimizeRoute usa `status` para no reordenar entregas ya resueltas.
  status?: DeliveryStatus;
  deliveredAt?: string;
  failureReasonCode?: FailureReasonCode;
  failureReasonDetail?: string;
}
