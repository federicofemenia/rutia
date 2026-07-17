import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { CameraFeed } from '../../features/camera';
import { useRoute } from '../../features/route';
import { DeliveryReviewCard, ScannerPhase, useDeliveryCapture } from '../../features/scanner';
import { AppLayout } from '../../shared/components';

export function ScanPage() {
  const navigate = useNavigate();
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

  return (
    <AppLayout title="Escanear">
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <Inventory2Icon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          {session.deliveries.length} entregas cargadas
        </Typography>
      </Stack>

      <CameraFeed videoRef={videoRef} status={cameraStatus} errorMessage={cameraErrorMessage} />

      {cameraStatus === 'error' && (
        <Button variant="contained" onClick={requestCameraAccess}>
          Reintentar acceso a la cámara
        </Button>
      )}

      {(phase === ScannerPhase.Capturing || phase === ScannerPhase.Extracting) && cameraStatus === 'streaming' && (
        <Stack spacing={1}>
          <Button
            variant="contained"
            size="large"
            onClick={captureAndExtract}
            loading={phase === ScannerPhase.Extracting}
            loadingPosition="start"
          >
            {phase === ScannerPhase.Extracting ? 'Extrayendo dirección...' : 'Escanear etiqueta'}
          </Button>

          {phase === ScannerPhase.Capturing && session.deliveries.length > 0 && (
            <Button variant="outlined" size="large" onClick={() => navigate(ROUTES.home)}>
              Terminar de cargar
            </Button>
          )}
        </Stack>
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
        <DeliveryReviewCard value={draft} onChange={updateDraft} onSubmit={confirmDelivery} />
      )}
    </AppLayout>
  );
}
