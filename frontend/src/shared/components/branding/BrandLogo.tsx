import { Box } from '@mui/material';
import { BRAND } from '../../config/brand';

type BrandLogoSize = 'small' | 'medium' | 'large';

interface BrandLogoProps {
  size?: BrandLogoSize;
}

const LOGO_WIDTHS: Record<BrandLogoSize, number> = {
  small: 160,
  medium: 220,
  large: 300,
};

export function BrandLogo({ size = 'medium' }: BrandLogoProps) {
  return (
    <Box
      component="img"
      src={BRAND.assets.full}
      alt={`${BRAND.name} — ${BRAND.tagline}`}
      sx={{ width: '100%', maxWidth: LOGO_WIDTHS[size], height: 'auto', display: 'block' }}
    />
  );
}
