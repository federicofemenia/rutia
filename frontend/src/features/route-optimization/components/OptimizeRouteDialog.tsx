import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useCurrentLocation } from '../../geolocation';
import type { Coordinates, Delivery } from '../../route';
import { useOptimizeRoute } from '../hooks/useOptimizeRoute';

type Step = 'locating' | 'locationError' | 'askEnd' | 'enterAddress' | 'submitting' | 'submitError';

interface OptimizeRouteDialogProps {
  deliveries: Delivery[];
  onOptimized: (deliveries: Delivery[]) => void;
}

export function OptimizeRouteDialog({ deliveries, onOptimized }: OptimizeRouteDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('locating');
  const [start, setStart] = useState<Coordinates | null>(null);
  const [customAddress, setCustomAddress] = useState('');

  const { requestLocation, errorMessage: locationErrorMessage } = useCurrentLocation();
  const { optimize, errorMessage: optimizeErrorMessage } = useOptimizeRoute();

  const handleOpen = async () => {
    setOpen(true);
    setStep('locating');

    const coordinates = await requestLocation();

    if (coordinates) {
      setStart(coordinates);
      setStep('askEnd');
    } else {
      setStep('locationError');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCustomAddress('');
  };

  const runOptimize = async (end: Coordinates | { address: string }) => {
    if (!start) {
      return;
    }

    setStep('submitting');
    const result = await optimize({ deliveries, start, end });

    if (result) {
      onOptimized(result);
      handleClose();
    } else {
      setStep('submitError');
    }
  };

  return (
    <>
      <Button variant="outlined" size="small" onClick={handleOpen} disabled={deliveries.length < 2}>
        Optimizar recorrido
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Optimizar recorrido</DialogTitle>
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
                <Button variant="contained" onClick={handleOpen}>
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
                <TextField
                  label="Dirección de destino"
                  value={customAddress}
                  onChange={(event) => setCustomAddress(event.target.value)}
                  fullWidth
                  autoFocus
                />
                <Button
                  variant="contained"
                  onClick={() => runOptimize({ address: customAddress })}
                  disabled={customAddress.trim().length === 0}
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
