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
