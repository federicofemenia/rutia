import { Stack, Typography } from '@mui/material';
import { CameraView } from '../../features/camera';

export function ScanPage() {
  return (
    <Stack
      component="main"
      spacing={3}
      sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', px: 2 }}
    >
      <Typography variant="h5" component="h1">
        Escanear etiquetas
      </Typography>
      <CameraView />
    </Stack>
  );
}
