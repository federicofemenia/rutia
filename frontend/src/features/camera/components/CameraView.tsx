import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material';
import { useCamera } from '../hooks/useCamera';

export function CameraView() {
  const { videoRef, status, errorMessage, requestAccess, stop } = useCamera();

  return (
    <Stack spacing={2} sx={{ alignItems: 'center', width: '100%', maxWidth: 480, mx: 'auto' }}>
      <Box
        sx={{
          width: '100%',
          aspectRatio: '3 / 4',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'grey.900',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {status === 'loading' && <CircularProgress sx={{ color: 'common.white' }} />}
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          playsInline
          muted
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: status === 'streaming' ? 'block' : 'none',
          }}
        />
      </Box>

      {status === 'error' && errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      {status !== 'streaming' ? (
        <Button variant="contained" onClick={requestAccess} disabled={status === 'loading'}>
          Activar cámara
        </Button>
      ) : (
        <Button variant="outlined" onClick={stop}>
          Detener cámara
        </Button>
      )}
    </Stack>
  );
}
