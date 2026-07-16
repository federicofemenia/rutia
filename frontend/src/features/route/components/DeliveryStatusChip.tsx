import { Chip } from '@mui/material';
import { DELIVERY_STATUS_CONFIG } from '../config/deliveryStatusConfig';
import type { DeliveryStatus } from '../types';

interface DeliveryStatusChipProps {
  status: DeliveryStatus;
}

export function DeliveryStatusChip({ status }: DeliveryStatusChipProps) {
  const config = DELIVERY_STATUS_CONFIG[status];
  const Icon = config.icon;

  return <Chip icon={<Icon />} label={config.label} color={config.color} size="small" />;
}
