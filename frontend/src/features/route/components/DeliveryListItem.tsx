import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FlagIcon from '@mui/icons-material/Flag';
import NavigationIcon from '@mui/icons-material/Navigation';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Button, Card, CardActionArea, Stack, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { IconBadge } from '../../../shared/components';
import { DELIVERY_STATUS_CONFIG } from '../config/deliveryStatusConfig';
import { GEOCODING_REVIEW_MESSAGES } from '../config/geocodingReviewMessages';
import { DeliveryStatus, type Delivery } from '../types';
import type { DeliveryLegInfo } from '../utils/buildDeliveryLegInfo';
import { formatLocalityLine, formatStreetLine } from '../utils/formatDeliveryAddress';
import { formatDistance, formatDuration } from '../utils/formatRouteMetrics';
import { DeliveryStatusChip } from './DeliveryStatusChip';

interface DeliveryListItemProps {
  delivery: Delivery;
  /** Distancia/tiempo hasta la siguiente parada (u "última entrega"), si la ruta fue optimizada. */
  legInfo?: DeliveryLegInfo;
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

function LegCaption({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {icon}
      {text}
    </Typography>
  );
}

function DeliveryLegRow({ legInfo }: { legInfo: DeliveryLegInfo }) {
  if (legInfo.kind === 'last') {
    return (
      <Stack direction="row" sx={{ mt: 0.25 }}>
        <LegCaption icon={<FlagIcon sx={{ fontSize: 14 }} />} text="Última entrega" />
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
      <LegCaption icon={<DirectionsCarIcon sx={{ fontSize: 14 }} />} text={formatDistance(legInfo.distance)} />
      <LegCaption icon={<AccessTimeIcon sx={{ fontSize: 14 }} />} text={formatDuration(legInfo.duration)} />
    </Stack>
  );
}

export function DeliveryListItem({ delivery, legInfo, onOpen, onNavigate }: DeliveryListItemProps) {
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
            {legInfo && <DeliveryLegRow legInfo={legInfo} />}
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
