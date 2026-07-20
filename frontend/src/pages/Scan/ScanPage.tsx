import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { CameraFeed } from '../../features/camera';
import { useRoute } from '../../features/route';
import { DeliveryReviewCard, ScannerPhase, useDeliveryCapture } from '../../features/scanner';
import { AppLayout, GradientHero } from '../../shared/components';

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
    <AppLayout
      title="Escanear"
      header={
        <GradientHero>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <IconButton
              aria-label="Volver a Inicio"
              onClick={() => navigate(ROUTES.home)}
              sx={{ color: 'inherit', bgcolor: 'rgba(255,255,255,0.15)' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
                Escanear etiqueta
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Centrá la etiqueta dentro del recuadro
              </Typography>
            </Box>
          </Stack>
        </GradientHero>
      }
    >
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <Inventory2Icon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          {session.deliveries.length} entregas cargadas
        </Typography>
      </Stack>

      <CameraFeed
        videoRef={videoRef}
        status={cameraStatus}
        errorMessage={cameraErrorMessage}
        hidden={phase === ScannerPhase.Reviewing}
      />

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
            sx={{
              borderRadius: 999,
              py: 1,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              boxShadow: '0 12px 24px -8px rgba(30, 58, 138, 0.5)',
            }}
          >
            {phase === ScannerPhase.Extracting ? 'Extrayendo dirección...' : 'Capturar imagen'}
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
