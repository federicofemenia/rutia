import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';

type IconBadgeColor = 'primary' | 'secondary' | 'warning' | 'success' | 'error' | 'info';

interface IconBadgeProps {
  icon: ReactNode;
  color?: IconBadgeColor;
  size?: number;
}

export function IconBadge({ icon, color = 'primary', size = 40 }: IconBadgeProps) {
  return (
    <Box
      sx={(theme) => ({
        width: size,
        height: size,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        bgcolor: alpha(theme.palette[color].main, 0.12),
        color: `${color}.main`,
      })}
    >
      {icon}
    </Box>
  );
}
