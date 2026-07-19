import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import type { RefObject } from 'react';
import type { CameraStatus } from '../hooks/useCamera';

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
  /** Oculta el feed sin desmontarlo (ej. durante la revisión de una dirección ya capturada):
   *  el <video> mantiene su `srcObject` — si se desmontara, al volver a mostrarlo quedaría en
   *  blanco, porque el stream no se reasigna solo. */
  hidden?: boolean;
}

const CORNER_SIZE = 32;
const CORNER_THICKNESS = 4;
const CORNER_GLOW = 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.7))';

interface CornerBracketProps {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'right';
}

function CornerBracket({ vertical, horizontal }: CornerBracketProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        [vertical]: 0,
        [horizontal]: 0,
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderColor: 'secondary.main',
        filter: CORNER_GLOW,
        [`border${vertical === 'top' ? 'Top' : 'Bottom'}`]: `${CORNER_THICKNESS}px solid`,
        [`border${horizontal === 'left' ? 'Left' : 'Right'}`]: `${CORNER_THICKNESS}px solid`,
        [`border${vertical === 'top' ? 'Top' : 'Bottom'}${horizontal === 'left' ? 'Left' : 'Right'}Radius`]: 12,
      }}
    />
  );
}

export function CameraFeed({ videoRef, status, errorMessage, hidden = false }: CameraFeedProps) {
  return (
    <Stack
      spacing={2}
      sx={{ display: hidden ? 'none' : 'flex', alignItems: 'center', width: '100%', maxWidth: 420, mx: 'auto' }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'grey.900',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
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

        {status === 'streaming' && (
          <>
            <Chip
              icon={<PhotoCameraIcon fontSize="small" sx={{ color: '#FFFFFF !important' }} />}
              label="Cámara activa"
              size="small"
              sx={{ position: 'absolute', top: 12, bgcolor: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF' }}
            />

            <Box sx={{ position: 'absolute', inset: 20, pointerEvents: 'none' }}>
              <CornerBracket vertical="top" horizontal="left" />
              <CornerBracket vertical="top" horizontal="right" />
              <CornerBracket vertical="bottom" horizontal="left" />
              <CornerBracket vertical="bottom" horizontal="right" />
            </Box>
          </>
        )}
      </Box>

      {status === 'streaming' && (
        <Typography variant="caption" color="text.secondary">
          Acercá la cámara a la etiqueta y encuadrala dentro del marco
        </Typography>
      )}

      {status === 'error' && errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </Stack>
  );
}
