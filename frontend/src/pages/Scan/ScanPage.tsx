import { Alert, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../features/auth';
import { CameraFeed } from '../../features/camera';
import { PlacesAutocompleteInput } from '../../features/places';
import { useRoute } from '../../features/route';
import { DeliveryReviewCard, ScannerPhase, useDeliveryCapture } from '../../features/scanner';
import { AppBrandHeader, AppLayout } from '../../shared/components';

export function ScanPage() {
  const { logout } = useAuth();
  const {
    phase,
    videoRef,
    cameraStatus,
    cameraErrorMessage,
    requestCameraAccess,
    errorMessage,
    draft,
    captureAndExtract,
    retry,
    confirmDelivery,
  } = useDeliveryCapture();
  const { session } = useRoute();
  const deliveryCount = session.deliveries.length;
  const [isManualEntry, setIsManualEntry] = useState(false);

  return (
    <AppLayout title="Escanear" header={<AppBrandHeader onLogout={logout} />}>
      {!isManualEntry && (
        <CameraFeed
          videoRef={videoRef}
          status={cameraStatus}
          errorMessage={cameraErrorMessage}
          hidden={phase === ScannerPhase.Reviewing}
          processing={phase === ScannerPhase.Extracting}
        />
      )}

      <Stack spacing={0}>
        <Typography
          key={deliveryCount}
          variant="h2"
          sx={{
            fontWeight: 900,
            textAlign: 'center',
            color: 'primary.main',
            animation: 'scanner-counter-pulse 0.4s ease-out',
            '@keyframes scanner-counter-pulse': {
              '0%': { transform: 'scale(1.25)', opacity: 0.6 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        >
          {deliveryCount}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {deliveryCount === 1 ? 'entrega cargada' : 'entregas cargadas'}
        </Typography>
      </Stack>

      {!isManualEntry && cameraStatus === 'error' && (
        <Button variant="contained" onClick={requestCameraAccess}>
          Reintentar acceso a la cámara
        </Button>
      )}

      {!isManualEntry && phase !== ScannerPhase.Reviewing && phase !== ScannerPhase.Error && cameraStatus === 'streaming' && (
        <Button
          variant="contained"
          size="large"
          onClick={captureAndExtract}
          loading={phase === ScannerPhase.Extracting}
          loadingPosition="start"
          sx={{
            borderRadius: 999,
            py: 1,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            boxShadow: '0 12px 24px -8px rgba(30, 58, 138, 0.5)',
          }}
        >
          {phase === ScannerPhase.Extracting ? 'Leyendo dirección...' : 'Obtener dirección'}
        </Button>
      )}

      {!isManualEntry && phase === ScannerPhase.Error && (
        <Stack spacing={1} sx={{ alignItems: 'center' }}>
          <Alert severity="error">{errorMessage}</Alert>
          <Button variant="contained" onClick={retry}>
            Reintentar
          </Button>
        </Stack>
      )}

      {!isManualEntry && phase === ScannerPhase.Reviewing && draft && (
        <DeliveryReviewCard value={draft} onConfirm={confirmDelivery} />
      )}

      {!isManualEntry && phase !== ScannerPhase.Reviewing && (
        <Button variant="text" onClick={() => setIsManualEntry(true)} sx={{ textTransform: 'none' }}>
          Agregar dirección manualmente
        </Button>
      )}

      {isManualEntry && (
        <Stack spacing={1.5}>
          <PlacesAutocompleteInput
            label="Dirección de entrega"
            onSelect={(selection) => {
              confirmDelivery(selection);
              setIsManualEntry(false);
            }}
          />
          <Button variant="text" onClick={() => setIsManualEntry(false)} sx={{ textTransform: 'none' }}>
            Volver a la cámara
          </Button>
        </Stack>
      )}
    </AppLayout>
  );
}
