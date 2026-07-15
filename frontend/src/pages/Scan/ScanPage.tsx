import { Alert, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { CameraFeed } from '../../features/camera';
import { useRoute } from '../../features/route';
import { DeliveryForm, ScannerPhase, useDeliveryCapture } from '../../features/scanner';

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
  } = useDeliveryCapture();
  const { session } = useRoute();
  const navigate = useNavigate();

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
        📦 Entregas cargadas: {session.deliveries.length}
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

      {phase === ScannerPhase.Capturing && session.deliveries.length > 0 && (
        <Button variant="outlined" onClick={() => navigate(ROUTES.routeSummary)}>
          Finalizar escaneo
        </Button>
      )}
    </Stack>
  );
}
