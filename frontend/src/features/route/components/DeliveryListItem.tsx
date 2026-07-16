import { ListItemButton, ListItemText } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DeliveryStatus, type Delivery } from '../types';
import { DeliveryStatusChip } from './DeliveryStatusChip';

interface DeliveryListItemProps {
  delivery: Delivery;
  onOpen: (delivery: Delivery) => void;
}

export function DeliveryListItem({ delivery, onOpen }: DeliveryListItemProps) {
  const isInProgress = delivery.status === DeliveryStatus.InProgress;

  return (
    <ListItemButton
      divider
      onClick={() => onOpen(delivery)}
      sx={(theme) => ({
        gap: 1,
        py: 1,
        ...(isInProgress && {
          bgcolor: alpha(theme.palette.info.main, 0.08),
          borderLeft: `3px solid ${theme.palette.info.main}`,
        }),
      })}
    >
      <ListItemText
        primary={delivery.address || '(sin dirección)'}
        secondary={delivery.postalCode ? `CP ${delivery.postalCode}` : undefined}
        slotProps={{
          primary: { variant: 'body2', noWrap: true, sx: { fontWeight: 600 } },
          secondary: { variant: 'caption' },
        }}
        sx={{ m: 0 }}
      />
      <DeliveryStatusChip status={delivery.status} />
    </ListItemButton>
  );
}
