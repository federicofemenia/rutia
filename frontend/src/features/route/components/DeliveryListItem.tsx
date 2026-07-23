import NavigationIcon from '@mui/icons-material/Navigation';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Button, Card, CardActionArea, Stack, Tooltip, Typography } from '@mui/material';
import { IconBadge } from '../../../shared/components';
import { DELIVERY_STATUS_CONFIG } from '../config/deliveryStatusConfig';
import { GEOCODING_REVIEW_MESSAGES } from '../config/geocodingReviewMessages';
import { DeliveryStatus, type Delivery } from '../types';
import { formatLocalityLine, formatStreetLine } from '../utils/formatDeliveryAddress';
import { DeliveryStatusChip } from './DeliveryStatusChip';

interface DeliveryListItemProps {
  delivery: Delivery;
  onOpen: (delivery: Delivery) => void;
  onNavigate: (delivery: Delivery) => void;
}

const STATUS_ICON_BADGE_COLOR: Record<DeliveryStatus, 'warning' | 'info' | 'success' | 'error'> = {
  [DeliveryStatus.Pending]: 'warning',
  [DeliveryStatus.InProgress]: 'info',
  [DeliveryStatus.Delivered]: 'success',
  [DeliveryStatus.Failed]: 'error',
};

function formatDeliveredTime(deliveredAt?: string): string | null {
  if (!deliveredAt) {
    return null;
  }
  return new Date(deliveredAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function DeliveryListItem({ delivery, onOpen, onNavigate }: DeliveryListItemProps) {
  const isInProgress = delivery.status === DeliveryStatus.InProgress;
  const reviewMessage = GEOCODING_REVIEW_MESSAGES[delivery.geocodingStatus];
  const StatusIcon = DELIVERY_STATUS_CONFIG[delivery.status].icon;
  const deliveredTime = formatDeliveredTime(delivery.deliveredAt);

  return (
    <Card>
      <CardActionArea onClick={() => onOpen(delivery)} sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <IconBadge icon={<StatusIcon fontSize="small" />} color={STATUS_ICON_BADGE_COLOR[delivery.status]} />

          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
              {formatStreetLine(delivery.address) || '(sin dirección)'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {formatLocalityLine(delivery.address) || undefined}
            </Typography>
          </Stack>

          <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
            {reviewMessage && (
              <Tooltip title={reviewMessage}>
                <WarningAmberIcon fontSize="small" color="warning" />
              </Tooltip>
            )}
            <DeliveryStatusChip status={delivery.status} />
            {deliveredTime && (
              <Typography variant="caption" color="text.secondary">
                {deliveredTime}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardActionArea>

      {isInProgress && (
        <Button
          fullWidth
          color="primary"
          startIcon={<NavigationIcon fontSize="small" />}
          onClick={() => onNavigate(delivery)}
          sx={{ borderRadius: 0, py: 1 }}
        >
          Navegar
        </Button>
      )}
    </Card>
  );
}
