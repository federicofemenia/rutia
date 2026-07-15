import { Alert, Box, CircularProgress, Stack } from '@mui/material';
import type { RefObject } from 'react';
import type { CameraStatus } from '../hooks/useCamera';

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
}

export function CameraFeed({ videoRef, status, errorMessage }: CameraFeedProps) {
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
    </Stack>
  );
}
