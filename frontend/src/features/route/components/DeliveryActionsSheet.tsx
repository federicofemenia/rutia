import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import NavigationIcon from '@mui/icons-material/Navigation';
import UndoIcon from '@mui/icons-material/Undo';
import { Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useState } from 'react';
import type { PlaceSelection } from '../../places';
import { BottomSheet } from '../../../shared/components';
import { FAILURE_REASON_LABELS } from '../config/failureReasonConfig';
import { useRoute } from '../hooks/useRoute';
import { DeliveryStatus, type Delivery, type FailureReasonCode } from '../types';
import { formatLastModified } from '../utils/formatLastModified';
import { formatLocalityLine, formatStreetLine } from '../utils/formatDeliveryAddress';
import { EditDeliveryAddressDialog } from './EditDeliveryAddressDialog';
import { FailDeliveryDialog } from './FailDeliveryDialog';

interface DeliveryActionsSheetProps {
  delivery: Delivery | null;
  onClose: () => void;
  onNavigate: (delivery: Delivery) => void;
}

export function DeliveryActionsSheet({ delivery, onClose, onNavigate }: DeliveryActionsSheetProps) {
  const { completeDelivery, undoStartDelivery, failDelivery, editDeliveryAddress } = useRoute();
  const [failingDeliveryId, setFailingDeliveryId] = useState<string | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);

  const handleFailConfirm = (failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => {
    if (failingDeliveryId) {
      failDelivery(failingDeliveryId, failureReasonCode, failureReasonDetail);
    }
    setFailingDeliveryId(null);
  };

  // La nueva dirección ya viene resuelta a coordenadas por Places. No se recalcula la ruta acá —
  // el chofer decide cuándo optimizar de nuevo con el botón "Optimizar ruta" en Mi ruta.
  const handleSaveAddress = ({ address, coordinates }: PlaceSelection) => {
    if (!editingDelivery) {
      return;
    }

    editDeliveryAddress(editingDelivery.id, address, coordinates);
    setEditingDelivery(null);
  };

  return (
    <>
      <BottomSheet open={delivery !== null} onClose={onClose}>
        {delivery && (
          <>
            <Typography variant="subtitle1" noWrap>
              {formatStreetLine(delivery.address) || '(sin dirección)'}
            </Typography>
            {formatLocalityLine(delivery.address) && (
              <Typography variant="caption" color="text.secondary">
                {formatLocalityLine(delivery.address)}
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
              <ListItemButton
                disableGutters
                onClick={() => {
                  setEditingDelivery(delivery);
                  onClose();
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <EditIcon />
                </ListItemIcon>
                <ListItemText primary="Editar dirección" />
              </ListItemButton>

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
                  <ListItemButton
                    disableGutters
                    onClick={() => {
                      undoStartDelivery(delivery.id);
                      onClose();
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <UndoIcon color="action" />
                    </ListItemIcon>
                    <ListItemText primary="Deshacer inicio" secondary="Por si iniciaste este reparto por error" />
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

      <EditDeliveryAddressDialog delivery={editingDelivery} onClose={() => setEditingDelivery(null)} onSave={handleSaveAddress} />
    </>
  );
}
