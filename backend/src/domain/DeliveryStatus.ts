export const DeliveryStatus = {
  Pending: 'pending',
  InProgress: 'inProgress',
  Delivered: 'delivered',
  Failed: 'failed',
} as const;

export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];
