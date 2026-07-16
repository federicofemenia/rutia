import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { ChipProps, SvgIconProps } from '@mui/material';
import type { ComponentType } from 'react';
import { DeliveryStatus } from '../types';

interface DeliveryStatusConfig {
  label: string;
  color: ChipProps['color'];
  icon: ComponentType<SvgIconProps>;
}

export const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, DeliveryStatusConfig> = {
  [DeliveryStatus.Pending]: { label: 'Pendiente', color: 'warning', icon: ScheduleIcon },
  [DeliveryStatus.InProgress]: { label: 'En curso', color: 'info', icon: LocalShippingIcon },
  [DeliveryStatus.Delivered]: { label: 'Entregado', color: 'success', icon: CheckCircleIcon },
  [DeliveryStatus.Failed]: { label: 'Fallido', color: 'error', icon: ErrorIcon },
};
