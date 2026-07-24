import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useCurrentLocation } from '../../geolocation';
import { PlacesAutocompleteInput, type PlaceSelection } from '../../places';
import {
  type Coordinates,
  type CustomDestination,
  type Delivery,
  type OptimizeRouteResult,
  type OptimizeRouteSummary,
  useOptimizeRoute,
} from '../../route';

type Step = 'locating' | 'locationError' | 'askEnd' | 'enterAddress' | 'submitting' | 'submitError' | 'result';

interface OptimizeRouteDialogProps {
  open: boolean;
  deliveries: Delivery[];
  onClose: () => void;
  onOptimized: (
    deliveries: Delivery[],
    route: OptimizeRouteSummary | undefined,
    hasCustomDestination: boolean,
    customDestination?: CustomDestination,
  ) => void;
}

function formatResultSummary({ stats }: OptimizeRouteResult): string {
  const readyLabel = stats.verified === 1 ? 'entrega lista' : 'entregas listas';
  let summary = `Ruta optimizada. ${stats.verified} ${readyLabel}.`;

  const needsReview = stats.ambiguous + stats.notFound;
  if (needsReview > 0) {
    const reviewLabel = needsReview === 1 ? 'requiere revisión' : 'requieren revisión';
    summary += ` ${needsReview} ${reviewLabel}.`;
  }

  if (stats.error > 0) {
    const errorLabel = stats.error === 1 ? 'no tiene ubicación' : 'no tienen ubicación';
    summary += ` ${stats.error} ${errorLabel} — editá su dirección o eliminala.`;
  }

  return summary;
}

export function OptimizeRouteDialog({ open, deliveries, onClose, onOptimized }: OptimizeRouteDialogProps) {
  const [step, setStep] = useState<Step>('locating');
  const [start, setStart] = useState<Coordinates | null>(null);
  const [customDestination, setCustomDestination] = useState<CustomDestination | null>(null);
  const [result, setResult] = useState<OptimizeRouteResult | null>(null);
  const [hasCustomDestination, setHasCustomDestination] = useState(false);

  const { requestLocation, errorMessage: locationErrorMessage } = useCurrentLocation();
  const { optimize, errorMessage: optimizeErrorMessage } = useOptimizeRoute();

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
      setCustomDestination(null);
      setResult(null);
      setHasCustomDestination(false);
      startLocating();
    }
  }, [open, startLocating]);

  const runOptimize = async (end: Coordinates, isCustomDestination: boolean) => {
    if (!start) {
      return;
    }

    setStep('submitting');
    setHasCustomDestination(isCustomDestination);
    const optimizeResult = await optimize({ deliveries, start, end });

    if (optimizeResult) {
      setResult(optimizeResult);
      setStep('result');
    } else {
      setStep('submitError');
    }
  };

  const handleSelectDestination = (selection: PlaceSelection) => {
    setCustomDestination(selection);
    void runOptimize(selection.coordinates, true);
  };

  const handleDone = () => {
    if (result) {
      onOptimized(result.deliveries, result.route, hasCustomDestination, hasCustomDestination ? (customDestination ?? undefined) : undefined);
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
                <Button variant="contained" onClick={() => start && runOptimize(start, false)}>
                  Sí
                </Button>
                <Button variant="outlined" onClick={() => setStep('enterAddress')}>
                  No
                </Button>
              </Stack>
            </>
          )}

          {step === 'enterAddress' && (
            <PlacesAutocompleteInput label="Dirección de destino" onSelect={handleSelectDestination} />
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
