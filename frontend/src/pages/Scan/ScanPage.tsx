import { Alert, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useExtractAddress } from '../../features/address-extraction';
import { CameraFeed, useCamera } from '../../features/camera';

interface Feedback {
  severity: 'success' | 'error';
  message: string;
}

export function ScanPage() {
  const { videoRef, status: cameraStatus, errorMessage, requestAccess, capturePhoto } = useCamera();
  const { status: extractStatus, extract } = useExtractAddress();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (cameraStatus === 'idle') {
      requestAccess();
    }
  }, [cameraStatus, requestAccess]);

  const handleSaveAddress = async () => {
    const photo = capturePhoto();
    if (!photo) {
      setFeedback({
        severity: 'error',
        message: 'No se pudo capturar la foto. Esperá a que la cámara termine de cargar e intentá de nuevo.',
      });
      return;
    }

    const result = await extract(photo);
    console.log(result);

    if (!result) {
      setFeedback({ severity: 'error', message: 'No se pudo extraer la dirección. Probá de nuevo.' });
      return;
    }

    setFeedback({
      severity: 'success',
      message: `Dirección: ${result.address || '(no detectada)'} — CP: ${result.postalCode || '(no detectado)'}`,
    });
  };

  return (
    <Stack
      component="main"
      spacing={3}
      sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', px: 2 }}
    >
      <Typography variant="h5" component="h1">
        Escanear etiquetas
      </Typography>

      <CameraFeed videoRef={videoRef} status={cameraStatus} errorMessage={errorMessage} />

      {cameraStatus === 'error' && (
        <Button variant="contained" onClick={requestAccess}>
          Reintentar
        </Button>
      )}

      {cameraStatus === 'streaming' && (
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveAddress}
          loading={extractStatus === 'loading'}
          loadingPosition="start"
          loadingIndicator={<CircularProgress size={20} color="inherit" />}
        >
          {extractStatus === 'loading' ? 'Extrayendo dirección...' : 'Guardar dirección'}
        </Button>
      )}

      <Snackbar
        open={feedback !== null}
        autoHideDuration={6000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={feedback?.severity ?? 'success'} onClose={() => setFeedback(null)} sx={{ width: '100%' }}>
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
