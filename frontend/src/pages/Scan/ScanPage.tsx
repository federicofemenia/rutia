import { Alert, Button, Stack, Typography } from '@mui/material';
import { CameraFeed } from '../../features/camera';
import { DeliveryForm, ScannerPhase, useDeliveryCapture } from '../../features/deliveries';

export function ScanPage() {
  const {
    phase,
    videoRef,
    cameraStatus,
    cameraErrorMessage,
    requestCameraAccess,
    errorMessage,
    draft,
    updateDraft,
    captureAndExtract,
    retry,
    confirmDelivery,
    deliveries,
  } = useDeliveryCapture();

  return (
    <Stack
      component="main"
      spacing={3}
      sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', px: 2, py: 4 }}
    >
      <Typography variant="h5" component="h1">
        Escanear etiquetas
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {deliveries.length} entregas cargadas
      </Typography>

      <CameraFeed videoRef={videoRef} status={cameraStatus} errorMessage={cameraErrorMessage} />

      {cameraStatus === 'error' && (
        <Button variant="contained" onClick={requestCameraAccess}>
          Reintentar acceso a la cámara
        </Button>
      )}

      {(phase === ScannerPhase.Capturing || phase === ScannerPhase.Extracting) && cameraStatus === 'streaming' && (
        <Button
          variant="contained"
          size="large"
          onClick={captureAndExtract}
          loading={phase === ScannerPhase.Extracting}
          loadingPosition="start"
        >
          {phase === ScannerPhase.Extracting ? 'Extrayendo dirección...' : 'Escanear etiqueta'}
        </Button>
      )}

      {phase === ScannerPhase.Error && (
        <Stack spacing={1} sx={{ alignItems: 'center' }}>
          <Alert severity="error">{errorMessage}</Alert>
          <Button variant="contained" onClick={retry}>
            Reintentar
          </Button>
        </Stack>
      )}

      {phase === ScannerPhase.Reviewing && draft && (
        <DeliveryForm value={draft} onChange={updateDraft} onSubmit={confirmDelivery} />
      )}
    </Stack>
  );
}
