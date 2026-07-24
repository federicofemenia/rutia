import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigationIcon from '@mui/icons-material/Navigation';
import { Alert, CircularProgress, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { BottomSheet } from '../../../shared/components';
import { FAILURE_REASON_LABELS } from '../config/failureReasonConfig';
import { GEOCODING_REVIEW_MESSAGES } from '../config/geocodingReviewMessages';
import { useAutoReoptimize } from '../hooks/useAutoReoptimize';
import { useRetryGeocoding } from '../hooks/useRetryGeocoding';
import { useRoute } from '../hooks/useRoute';
import {
  DeliveryStatus,
  GeocodingStatus,
  type Coordinates,
  type Delivery,
  type DeliveryAddress,
  type FailureReasonCode,
  type GeocodeCandidateOption,
} from '../types';
import { formatLastModified } from '../utils/formatLastModified';
import { formatLocalityLine, formatStreetLine } from '../utils/formatDeliveryAddress';
import { EditDeliveryAddressDialog } from './EditDeliveryAddressDialog';
import { FailDeliveryDialog } from './FailDeliveryDialog';
import { GeocodeOptionsDialog } from './GeocodeOptionsDialog';

interface DeliveryActionsSheetProps {
  delivery: Delivery | null;
  onClose: () => void;
  onNavigate: (delivery: Delivery) => void;
}

export function DeliveryActionsSheet({ delivery, onClose, onNavigate }: DeliveryActionsSheetProps) {
  const { session, completeDelivery, failDelivery, editDeliveryAddress, updateDeliveryGeocoding } = useRoute();
  const [failingDeliveryId, setFailingDeliveryId] = useState<string | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const { status: retryStatus, retry: retryGeocoding } = useRetryGeocoding();
  const { triggerAutoReoptimize } = useAutoReoptimize();
  const [staleGeocodingStatus, setStaleGeocodingStatus] = useState<GeocodingStatus | null>(null);
  const [retryFailureMessage, setRetryFailureMessage] = useState<string | null>(null);
  const [geocodeOptions, setGeocodeOptions] = useState<GeocodeCandidateOption[] | null>(null);

  useEffect(() => {
    setStaleGeocodingStatus(null);
    setRetryFailureMessage(null);
    setGeocodeOptions(null);
  }, [delivery?.id]);

  const handleFailConfirm = (failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => {
    if (failingDeliveryId) {
      failDelivery(failingDeliveryId, failureReasonCode, failureReasonDetail);
    }
    setFailingDeliveryId(null);
  };

  const handleSaveAddress = (address: DeliveryAddress) => {
    if (editingDelivery) {
      editDeliveryAddress(editingDelivery.id, address);
    }
    setEditingDelivery(null);
  };

  // Guarda la nueva ubicación de la entrega y, si quedó `Verified`, recalcula toda la ruta en
  // segundo plano — hasta ahora esa entrega no formaba parte del recorrido optimizado (solo se
  // rutean las `Verified`), así que sin esto las distancias/tiempos quedarían desactualizados o
  // directamente sin la card de "próxima parada" para ella.
  const applyGeocodingResolution = (target: Delivery, coordinates: Coordinates | undefined, geocodingStatus: GeocodingStatus) => {
    updateDeliveryGeocoding(target.id, coordinates, geocodingStatus);

    if (geocodingStatus === GeocodingStatus.Verified) {
      const patchedDeliveries = session.deliveries.map((candidate) =>
        candidate.id === target.id ? { ...candidate, coordinates, geocodingStatus } : candidate,
      );
      void triggerAutoReoptimize(patchedDeliveries);
    }
  };

  const handleRetryGeocoding = async () => {
    if (!delivery) {
      return;
    }

    setStaleGeocodingStatus(null);
    setRetryFailureMessage(null);
    const resolution = await retryGeocoding(delivery.address);

    if (!resolution) {
      setRetryFailureMessage('No se pudo obtener la ubicación. Probá de nuevo en un momento.');
      return;
    }

    if (resolution.options && resolution.options.length > 1) {
      // Varias ubicaciones empatadas (misma calle/localidad/CP, coordenadas distintas): no hay
      // forma de elegir una sola con confianza, así que se le ofrecen al chofer en vez de
      // guardar cualquiera de ellas.
      setGeocodeOptions(resolution.options);
      return;
    }

    applyGeocodingResolution(delivery, resolution.coordinates, resolution.geocodingStatus);

    if (resolution.geocodingStatus === GeocodingStatus.Verified) {
      onClose();
    } else {
      // Sigue sin resolverse (mismo motivo u otro) — se avisa acá en vez de cerrar la hoja como
      // si nada hubiera pasado, para que el chofer sepa que el reintento no alcanzó.
      setStaleGeocodingStatus(resolution.geocodingStatus);
    }
  };

  const handleSelectGeocodeOption = (option: GeocodeCandidateOption) => {
    if (!delivery) {
      return;
    }

    applyGeocodingResolution(delivery, option.coordinates, GeocodingStatus.Verified);
    setGeocodeOptions(null);
    onClose();
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

            {staleGeocodingStatus && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                {GEOCODING_REVIEW_MESSAGES[staleGeocodingStatus] ?? 'Seguimos sin poder ubicar esta dirección.'}
              </Alert>
            )}

            {retryFailureMessage && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {retryFailureMessage}
              </Alert>
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

              {delivery.geocodingStatus !== GeocodingStatus.Verified && (
                <ListItemButton disableGutters disabled={retryStatus === 'loading'} onClick={handleRetryGeocoding}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {retryStatus === 'loading' ? <CircularProgress size={20} /> : <LocationOnIcon />}
                  </ListItemIcon>
                  <ListItemText primary="Ubicar nuevamente" />
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

      <EditDeliveryAddressDialog delivery={editingDelivery} onClose={() => setEditingDelivery(null)} onSave={handleSaveAddress} />

      <GeocodeOptionsDialog options={geocodeOptions} onSelect={handleSelectGeocodeOption} onClose={() => setGeocodeOptions(null)} />
    </>
  );
}
