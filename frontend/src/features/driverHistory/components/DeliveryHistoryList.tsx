import { List, ListItem, ListItemText, Typography } from '@mui/material';
import {
  DeliveryStatus,
  DeliveryStatusChip,
  FAILURE_REASON_LABELS,
  formatLocalityLine,
  formatStreetLine,
  type Delivery,
} from '../../route';

interface DeliveryHistoryListProps {
  deliveries: Delivery[];
}

/** Reutilizado por `DriverHistoryAccordion` (detalle de una sesión ya finalizada) e `InProgressRouteAccordion` (ruta activa) — mismos chips y colores en ambos casos. */
export function DeliveryHistoryList({ deliveries }: DeliveryHistoryListProps) {
  return (
    <List disablePadding>
      {deliveries.map((delivery) => (
        <ListItem key={delivery.id} divider sx={{ gap: 1, alignItems: 'flex-start', px: 0 }}>
          <ListItemText
            primary={formatStreetLine(delivery.address) || '(sin dirección)'}
            secondary={
              <>
                {formatLocalityLine(delivery.address) && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {formatLocalityLine(delivery.address)}
                  </Typography>
                )}
                {delivery.status === DeliveryStatus.Failed && delivery.failureReasonCode && (
                  <Typography component="span" variant="caption" color="error" sx={{ display: 'block' }}>
                    {FAILURE_REASON_LABELS[delivery.failureReasonCode]}
                    {delivery.failureReasonDetail ? `: ${delivery.failureReasonDetail}` : ''}
                  </Typography>
                )}
              </>
            }
            slotProps={{
              primary: { variant: 'body2', noWrap: true, sx: { fontWeight: 600 } },
            }}
          />
          <DeliveryStatusChip status={delivery.status} />
        </ListItem>
      ))}
    </List>
  );
}
