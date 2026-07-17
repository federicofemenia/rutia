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
  // Ciclo de vida de la entrega: OptimizeRoute no los usa (por eso opcionales acá), pero una
  // RouteSession persistida siempre los trae — reflejan el estado que ya maneja el frontend.
  status?: DeliveryStatus;
  deliveredAt?: string;
  failureReasonCode?: FailureReasonCode;
  failureReasonDetail?: string;
}
