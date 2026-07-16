import { Chip, Stack } from '@mui/material';
import { ProgressBar } from '../../../shared/components';
import { DELIVERY_STATUS_CONFIG } from '../config/deliveryStatusConfig';
import { DeliveryStatus, type Delivery } from '../types';
import { summarizeDeliveries } from '../utils/summarizeDeliveries';

interface RouteSummaryStatsProps {
  deliveries: Delivery[];
}

export function RouteSummaryStats({ deliveries }: RouteSummaryStatsProps) {
  const counts = summarizeDeliveries(deliveries);
  const delivered = counts[DeliveryStatus.Delivered];

  return (
    <Stack spacing={1}>
      <ProgressBar current={delivered} total={deliveries.length} label="entregadas" />
      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
        {Object.values(DeliveryStatus).map((status) => {
          const config = DELIVERY_STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <Chip
              key={status}
              icon={<Icon sx={{ fontSize: '0.9rem' }} />}
              label={counts[status]}
              color={config.color}
              size="small"
              variant="outlined"
            />
          );
        })}
      </Stack>
    </Stack>
  );
}
