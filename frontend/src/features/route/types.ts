export interface Coordinates {
  latitude: number;
  longitude: number;
}

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
  address: string;
  postalCode: string;
  createdAt: string;
  coordinates?: Coordinates;
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
