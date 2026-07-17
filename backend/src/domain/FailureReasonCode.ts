export const FailureReasonCode = {
  CustomerAbsent: 'customerAbsent',
  WrongAddress: 'wrongAddress',
  OrderRejected: 'orderRejected',
  AddressNotFound: 'addressNotFound',
  Other: 'other',
} as const;

export type FailureReasonCode = (typeof FailureReasonCode)[keyof typeof FailureReasonCode];
