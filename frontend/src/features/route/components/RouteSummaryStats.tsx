import { Chip, Stack, Typography } from '@mui/material';
import { DELIVERY_STATUS_CONFIG } from '../config/deliveryStatusConfig';
import { DeliveryStatus, type Delivery } from '../types';
import { summarizeDeliveries } from '../utils/summarizeDeliveries';

interface RouteSummaryStatsProps {
  deliveries: Delivery[];
}

export function RouteSummaryStats({ deliveries }: RouteSummaryStatsProps) {
  const counts = summarizeDeliveries(deliveries);

  return (
    <Stack spacing={1}>
      <Typography variant="body1">{deliveries.length} entregas</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {Object.values(DeliveryStatus).map((status) => {
          const config = DELIVERY_STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <Chip
              key={status}
              icon={<Icon />}
              label={`${counts[status]} ${config.label.toLowerCase()}`}
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
