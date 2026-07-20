import { Box, Stack, Typography, type TypographyProps } from '@mui/material';
import { BRAND } from '../../config/brand';
import { BrandIcon } from './BrandIcon';

type BrandLogoSize = 'small' | 'medium' | 'large';
type BrandLogoLayout = 'horizontal' | 'stacked';
type BrandLogoTone = 'light' | 'dark';

interface BrandLogoProps {
  size?: BrandLogoSize;
  /** 'horizontal' (default): ícono y texto en línea, como en encabezados compactos.
   *  'stacked': ícono grande arriba, texto centrado debajo — para pantallas hero (ej. Login). */
  layout?: BrandLogoLayout;
  /** Solo aplica a layout 'horizontal': 'light' (default) para fondos claros, 'dark' para fondos oscuros/degradé. */
  tone?: BrandLogoTone;
}

const LOGO_WIDTHS: Record<BrandLogoSize, number> = {
  small: 160,
  medium: 220,
  large: 300,
};

const STACKED_ICON_SIZES: Record<BrandLogoSize, number> = {
  small: 48,
  medium: 64,
  large: 84,
};

const STACKED_WORDMARK_VARIANT: Record<BrandLogoSize, TypographyProps['variant']> = {
  small: 'h6',
  medium: 'h5',
  large: 'h4',
};

const HORIZONTAL_ASSETS: Record<BrandLogoTone, string> = {
  light: BRAND.assets.full,
  dark: BRAND.assets.dark,
};

export function BrandLogo({ size = 'medium', layout = 'horizontal', tone = 'light' }: BrandLogoProps) {
  if (layout === 'stacked') {
    return (
      <Stack role="img" aria-label={`${BRAND.name} — ${BRAND.tagline}`} spacing={1} sx={{ alignItems: 'center' }}>
        <BrandIcon size={STACKED_ICON_SIZES[size]} />
        <Typography variant={STACKED_WORDMARK_VARIANT[size]} aria-hidden sx={{ fontWeight: 800 }}>
          <Box component="span" sx={{ color: 'text.primary' }}>
            RUT
          </Box>
          <Box component="span" sx={{ color: 'secondary.main' }}>
            IA
          </Box>
        </Typography>
        <Typography variant="overline" aria-hidden sx={{ color: 'text.secondary', letterSpacing: 3, lineHeight: 1 }}>
          {BRAND.tagline}
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      component="img"
      src={HORIZONTAL_ASSETS[tone]}
      alt={`${BRAND.name} — ${BRAND.tagline}`}
      sx={{ width: '100%', maxWidth: LOGO_WIDTHS[size], height: 'auto', display: 'block', flexShrink: 0 }}
    />
  );
}
