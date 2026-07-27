import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { BrandLogo } from './branding';
import { GradientHero } from './GradientHero';

/** Un ítem del menú hamburguesa — pensado para crecer (Perfil, Configuración, Ayuda, ...) sin tocar `AppBrandHeader`. */
export interface AppMenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
}

interface AppBrandHeaderProps {
  onLogout: () => void;
  /** Opciones específicas de la pantalla/rol, mostradas antes de "Cerrar sesión". Vacío si no aplica (ej. admin). */
  menuItems?: AppMenuItem[];
}

/**
 * Header unificado para las pantallas principales (Home, Escanear, Mi ruta, Mapa): mismo degradé,
 * misma marca, mismo menú en todas — sin título de pantalla, para no repetir el layout con
 * pequeñas variaciones en cada una. El contexto de qué pantalla es queda en el bottom nav
 * (resaltado) y en el contenido de cada pantalla.
 */
export function AppBrandHeader({ onLogout, menuItems = [] }: AppBrandHeaderProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  function closeMenu() {
    setAnchorEl(null);
  }

  function handleSelect(onSelect: () => void) {
    closeMenu();
    onSelect();
  }

  function handleLogout() {
    closeMenu();
    onLogout();
  }

  return (
    <GradientHero>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <BrandLogo size="small" tone="dark" />
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{ color: 'inherit', bgcolor: 'rgba(255,255,255,0.15)' }}
          aria-label="Abrir menú"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={closeMenu}>
          {menuItems.map((item) => (
            <MenuItem key={item.key} onClick={() => handleSelect(item.onSelect)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ))}
          {menuItems.length > 0 && <Divider />}
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cerrar sesión</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>
    </GradientHero>
  );
}
