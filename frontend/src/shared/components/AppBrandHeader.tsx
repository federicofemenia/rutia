import LogoutIcon from '@mui/icons-material/Logout';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import { BrandLogo } from './branding';
import { GradientHero } from './GradientHero';

interface AppBrandHeaderProps {
  onLogout: () => void;
}

/**
 * Header unificado para las pantallas principales (Home, Escanear, Mi ruta, Mapa): mismo degradé,
 * misma marca, mismo botón de cerrar sesión en todas — sin título de pantalla, para no repetir el
 * layout con pequeñas variaciones en cada una. El contexto de qué pantalla es queda en el bottom
 * nav (resaltado) y en el contenido de cada pantalla.
 */
export function AppBrandHeader({ onLogout }: AppBrandHeaderProps) {
  return (
    <GradientHero>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <BrandLogo size="small" tone="dark" />
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Cerrar sesión">
          <IconButton onClick={onLogout} sx={{ color: 'inherit', bgcolor: 'rgba(255,255,255,0.15)' }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </GradientHero>
  );
}
