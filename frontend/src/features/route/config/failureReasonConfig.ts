import { FailureReasonCode } from '../types';

export const FAILURE_REASON_LABELS: Record<FailureReasonCode, string> = {
  [FailureReasonCode.CustomerAbsent]: 'Cliente ausente',
  [FailureReasonCode.WrongAddress]: 'Dirección incorrecta',
  [FailureReasonCode.OrderRejected]: 'Rechazó el pedido',
  [FailureReasonCode.AddressNotFound]: 'No encontré el domicilio',
  [FailureReasonCode.Other]: 'Otro',
};
