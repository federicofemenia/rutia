import NavigationIcon from '@mui/icons-material/Navigation';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { IconButton, ListItemButton, ListItemText, Stack, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DeliveryStatus, GeocodingStatus, type Delivery } from '../types';
import { formatLocalityLine, formatStreetLine } from '../utils/formatDeliveryAddress';
import { DeliveryStatusChip } from './DeliveryStatusChip';

interface DeliveryListItemProps {
  delivery: Delivery;
  onOpen: (delivery: Delivery) => void;
  onNavigate: (delivery: Delivery) => void;
}

const GEOCODING_REVIEW_MESSAGES: Partial<Record<GeocodingStatus, string>> = {
  [GeocodingStatus.Ambiguous]: 'Dirección ambigua: hay varias coincidencias posibles. Revisá localidad y provincia.',
  [GeocodingStatus.NotFound]: 'No se encontró la dirección en el mapa. Revisá los datos.',
};

export function DeliveryListItem({ delivery, onOpen, onNavigate }: DeliveryListItemProps) {
  const isInProgress = delivery.status === DeliveryStatus.InProgress;
  const reviewMessage = GEOCODING_REVIEW_MESSAGES[delivery.geocodingStatus];

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
        primary={formatStreetLine(delivery.address) || '(sin dirección)'}
        secondary={formatLocalityLine(delivery.address) || undefined}
        slotProps={{
          primary: { variant: 'body2', noWrap: true, sx: { fontWeight: 600 } },
          secondary: { variant: 'caption' },
        }}
        sx={{ m: 0 }}
      />
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        {reviewMessage && (
          <Tooltip title={reviewMessage}>
            <WarningAmberIcon fontSize="small" color="warning" />
          </Tooltip>
        )}
        {isInProgress && (
          <Tooltip title="Navegar">
            <IconButton
              size="small"
              color="info"
              onClick={(event) => {
                event.stopPropagation();
                onNavigate(delivery);
              }}
            >
              <NavigationIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <DeliveryStatusChip status={delivery.status} />
      </Stack>
    </ListItemButton>
  );
}
