import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface GradientHeroProps {
  children: ReactNode;
}

export function GradientHero({ children }: GradientHeroProps) {
  return (
    <Box
      component="header"
      sx={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2947A8 100%)',
        color: '#FFFFFF',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        px: 3,
        pt: 'calc(env(safe-area-inset-top) + 20px)',
        pb: 2.5,
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}
