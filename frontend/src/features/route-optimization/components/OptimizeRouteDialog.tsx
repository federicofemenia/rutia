import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useCurrentLocation } from '../../geolocation';
import { AddressFields, type Coordinates, type Delivery, type DeliveryAddress, type OptimizeRouteSummary } from '../../route';
import type { OptimizeRouteResult } from '../api/optimizeRoute';
import { useOptimizeRoute } from '../hooks/useOptimizeRoute';

type Step = 'locating' | 'locationError' | 'askEnd' | 'enterAddress' | 'submitting' | 'submitError' | 'result';

interface OptimizeRouteDialogProps {
  open: boolean;
  deliveries: Delivery[];
  onClose: () => void;
  onOptimized: (deliveries: Delivery[], route: OptimizeRouteSummary | undefined, hasCustomDestination: boolean) => void;
}

const EMPTY_CUSTOM_ADDRESS: DeliveryAddress = { street: '', locality: '', province: '', country: 'Argentina' };

function formatResultSummary({ stats }: OptimizeRouteResult): string {
  const readyLabel = stats.verified === 1 ? 'entrega lista' : 'entregas listas';
  let summary = `Ruta optimizada. ${stats.verified} ${readyLabel}.`;

  const needsReview = stats.ambiguous + stats.notFound;
  if (needsReview > 0) {
    const reviewLabel = needsReview === 1 ? 'requiere revisión' : 'requieren revisión';
    summary += ` ${needsReview} ${reviewLabel}.`;
  }

  if (stats.error > 0) {
    // No es que la dirección esté mal: el proveedor de geocodificación no llegó a responder
    // (red, timeout, límite temporal). Quedan como pendientes para reintentar, no como un
    // resultado definitivo — por eso se distingue de "requiere revisión".
    const errorLabel = stats.error === 1 ? 'no se pudo verificar' : 'no se pudieron verificar';
    summary += ` ${stats.error} ${errorLabel} por un error temporal del servicio de mapas — probá optimizar de nuevo.`;
  }

  return summary;
}

export function OptimizeRouteDialog({ open, deliveries, onClose, onOptimized }: OptimizeRouteDialogProps) {
  const [step, setStep] = useState<Step>('locating');
  const [start, setStart] = useState<Coordinates | null>(null);
  const [customAddress, setCustomAddress] = useState<DeliveryAddress>(EMPTY_CUSTOM_ADDRESS);
  const [result, setResult] = useState<OptimizeRouteResult | null>(null);
  const [hasCustomDestination, setHasCustomDestination] = useState(false);

  const { requestLocation, errorMessage: locationErrorMessage } = useCurrentLocation();
  const { optimize, errorMessage: optimizeErrorMessage } = useOptimizeRoute();

  const canConfirmCustomAddress =
    customAddress.street.trim().length > 0 && customAddress.locality.trim().length > 0 && customAddress.province.trim().length > 0;

  const startLocating = useCallback(async () => {
    setStep('locating');
    const coordinates = await requestLocation();

    if (coordinates) {
      setStart(coordinates);
      setStep('askEnd');
    } else {
      setStep('locationError');
    }
  }, [requestLocation]);

  useEffect(() => {
    if (open) {
      setCustomAddress(EMPTY_CUSTOM_ADDRESS);
      setResult(null);
      setHasCustomDestination(false);
      startLocating();
    }
  }, [open, startLocating]);

  const runOptimize = async (end: Coordinates | { address: DeliveryAddress }) => {
    if (!start) {
      return;
    }

    setStep('submitting');
    setHasCustomDestination('address' in end);
    const optimizeResult = await optimize({ deliveries, start, end });

    if (optimizeResult) {
      setResult(optimizeResult);
      setStep('result');
    } else {
      setStep('submitError');
    }
  };

  const handleDone = () => {
    if (result) {
      onOptimized(result.deliveries, result.route, hasCustomDestination);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Preparando ruta</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {step === 'locating' && (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Obteniendo tu ubicación actual...</Typography>
            </Stack>
          )}

          {step === 'locationError' && (
            <>
              <Alert severity="error">{locationErrorMessage}</Alert>
              <Button variant="contained" onClick={startLocating}>
                Reintentar
              </Button>
            </>
          )}

          {step === 'askEnd' && (
            <>
              <Typography variant="body2">¿Querés terminar en tu ubicación actual?</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => start && runOptimize(start)}>
                  Sí
                </Button>
                <Button variant="outlined" onClick={() => setStep('enterAddress')}>
                  No
                </Button>
              </Stack>
            </>
          )}

          {step === 'enterAddress' && (
            <>
              <AddressFields
                value={customAddress}
                onChange={(patch) => setCustomAddress((previous) => ({ ...previous, ...patch }))}
              />
              {!canConfirmCustomAddress && (
                <Alert severity="warning" variant="outlined">
                  Completá calle, localidad y provincia para confirmar.
                </Alert>
              )}
              <Button
                variant="contained"
                onClick={() => runOptimize({ address: customAddress })}
                disabled={!canConfirmCustomAddress}
              >
                Confirmar
              </Button>
            </>
          )}

          {step === 'submitting' && (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Optimizando recorrido...</Typography>
            </Stack>
          )}

          {step === 'submitError' && (
            <>
              <Alert severity="error">{optimizeErrorMessage}</Alert>
              <Button variant="contained" onClick={() => setStep('askEnd')}>
                Volver a intentar
              </Button>
            </>
          )}

          {step === 'result' && result && (
            <>
              <Alert severity={result.stats.ambiguous + result.stats.notFound + result.stats.error > 0 ? 'warning' : 'success'}>
                {formatResultSummary(result)}
              </Alert>
              <Button variant="contained" onClick={handleDone}>
                Listo
              </Button>
            </>
          )}
        </Stack>
      </DialogContent>
      {step !== 'result' && (
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
