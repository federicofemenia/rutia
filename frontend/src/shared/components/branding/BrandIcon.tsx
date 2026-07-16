import { Box } from '@mui/material';
import { BRAND } from '../../config/brand';

interface BrandIconProps {
  variant?: 'default' | 'white';
  size?: number;
  decorative?: boolean;
}

export function BrandIcon({ variant = 'default', size = 28, decorative = true }: BrandIconProps) {
  const src = variant === 'white' ? BRAND.assets.iconWhite : BRAND.assets.icon;

  return (
    <Box
      component="img"
      src={src}
      alt={decorative ? '' : BRAND.name}
      aria-hidden={decorative || undefined}
      sx={{ width: size, height: size, display: 'block', flexShrink: 0 }}
    />
  );
}
