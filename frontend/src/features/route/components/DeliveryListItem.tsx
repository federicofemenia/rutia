import { Button, Collapse, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import { FAILURE_REASON_LABELS } from '../config/failureReasonConfig';
import { useRoute } from '../hooks/useRoute';
import { DeliveryStatus, type Delivery, type FailureReasonCode } from '../types';
import { formatLastModified } from '../utils/formatLastModified';
import { DeliveryStatusChip } from './DeliveryStatusChip';
import { FailDeliveryDialog } from './FailDeliveryDialog';

interface DeliveryListItemProps {
  delivery: Delivery;
  onNavigate: (delivery: Delivery) => void;
}

export function DeliveryListItem({ delivery, onNavigate }: DeliveryListItemProps) {
  const { startDelivery, completeDelivery, failDelivery } = useRoute();
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [showReason, setShowReason] = useState(false);

  const isInProgress = delivery.status === DeliveryStatus.InProgress;

  const handleFailConfirm = (failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => {
    failDelivery(delivery.id, failureReasonCode, failureReasonDetail);
  };

  return (
    <ListItem
      divider
      sx={(theme) => ({
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 1,
        py: 2,
        ...(isInProgress && {
          bgcolor: alpha(theme.palette.info.main, 0.08),
          borderLeft: `4px solid ${theme.palette.info.main}`,
        }),
      })}
    >
      <ListItemText
        primary={delivery.address || '(sin dirección)'}
        secondary={delivery.postalCode || undefined}
        sx={{ m: 0 }}
      />

      <DeliveryStatusChip status={delivery.status} />

      {delivery.status === DeliveryStatus.Pending && (
        <Button size="small" variant="contained" onClick={() => startDelivery(delivery.id)}>
          Comenzar entrega
        </Button>
      )}

      {delivery.status === DeliveryStatus.InProgress && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => onNavigate(delivery)}>
            Ir al destino
          </Button>
          <Button size="small" variant="contained" color="success" onClick={() => completeDelivery(delivery.id)}>
            Entregado
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={() => setFailDialogOpen(true)}>
            No se pudo entregar
          </Button>
        </Stack>
      )}

      {delivery.status === DeliveryStatus.Delivered && delivery.deliveredAt && (
        <Typography variant="body2" color="text.secondary">
          Entregado el {formatLastModified(new Date(delivery.deliveredAt))}
        </Typography>
      )}

      {delivery.status === DeliveryStatus.Failed && (
        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
          <Button size="small" onClick={() => setShowReason((prev) => !prev)}>
            Ver motivo
          </Button>
          <Collapse in={showReason}>
            {delivery.failureReasonCode && (
              <Typography variant="body2" color="text.secondary">
                {FAILURE_REASON_LABELS[delivery.failureReasonCode]}
                {delivery.failureReasonDetail ? `: ${delivery.failureReasonDetail}` : ''}
              </Typography>
            )}
          </Collapse>
        </Stack>
      )}

      <FailDeliveryDialog
        open={failDialogOpen}
        onClose={() => setFailDialogOpen(false)}
        onConfirm={handleFailConfirm}
      />
    </ListItem>
  );
}
