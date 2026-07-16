import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigationIcon from '@mui/icons-material/Navigation';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useState } from 'react';
import { BottomSheet } from '../../../shared/components';
import { FAILURE_REASON_LABELS } from '../config/failureReasonConfig';
import { useRoute } from '../hooks/useRoute';
import { DeliveryStatus, type Delivery, type FailureReasonCode } from '../types';
import { formatLastModified } from '../utils/formatLastModified';
import { FailDeliveryDialog } from './FailDeliveryDialog';

interface DeliveryActionsSheetProps {
  delivery: Delivery | null;
  onClose: () => void;
  onNavigate: (delivery: Delivery) => void;
}

export function DeliveryActionsSheet({ delivery, onClose, onNavigate }: DeliveryActionsSheetProps) {
  const { startDelivery, completeDelivery, failDelivery } = useRoute();
  const [failingDeliveryId, setFailingDeliveryId] = useState<string | null>(null);

  const handleFailConfirm = (failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => {
    if (failingDeliveryId) {
      failDelivery(failingDeliveryId, failureReasonCode, failureReasonDetail);
    }
    setFailingDeliveryId(null);
  };

  return (
    <>
      <BottomSheet open={delivery !== null} onClose={onClose}>
        {delivery && (
          <>
            <Typography variant="subtitle1" noWrap>
              {delivery.address || '(sin dirección)'}
            </Typography>
            {delivery.postalCode && (
              <Typography variant="caption" color="text.secondary">
                CP {delivery.postalCode}
              </Typography>
            )}

            <Divider sx={{ my: 1 }} />

            {delivery.status === DeliveryStatus.Delivered && delivery.deliveredAt && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                Entregado el {formatLastModified(new Date(delivery.deliveredAt))}
              </Typography>
            )}

            {delivery.status === DeliveryStatus.Failed && delivery.failureReasonCode && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                {FAILURE_REASON_LABELS[delivery.failureReasonCode]}
                {delivery.failureReasonDetail ? `: ${delivery.failureReasonDetail}` : ''}
              </Typography>
            )}

            <List disablePadding>
              {delivery.status === DeliveryStatus.Pending && (
                <ListItemButton
                  disableGutters
                  onClick={() => {
                    startDelivery(delivery.id);
                    onClose();
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PlayArrowIcon />
                  </ListItemIcon>
                  <ListItemText primary="Comenzar entrega" />
                </ListItemButton>
              )}

              {delivery.status === DeliveryStatus.InProgress && (
                <>
                  <ListItemButton
                    disableGutters
                    onClick={() => {
                      onNavigate(delivery);
                      onClose();
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <NavigationIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary="Navegar" />
                  </ListItemButton>
                  <ListItemButton
                    disableGutters
                    onClick={() => {
                      completeDelivery(delivery.id);
                      onClose();
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Marcar entregada" />
                  </ListItemButton>
                  <ListItemButton
                    disableGutters
                    onClick={() => {
                      setFailingDeliveryId(delivery.id);
                      onClose();
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CancelIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Marcar fallida" />
                  </ListItemButton>
                </>
              )}
            </List>

            <Divider sx={{ my: 1 }} />

            <ListItemButton disableGutters onClick={onClose} sx={{ justifyContent: 'center' }}>
              <ListItemText primary="Cancelar" sx={{ flexGrow: 0 }} />
            </ListItemButton>
          </>
        )}
      </BottomSheet>

      <FailDeliveryDialog
        open={failingDeliveryId !== null}
        onClose={() => setFailingDeliveryId(null)}
        onConfirm={handleFailConfirm}
      />
    </>
  );
}
