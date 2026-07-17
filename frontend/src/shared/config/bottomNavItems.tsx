import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RouteIcon from '@mui/icons-material/Route';
import type { ReactNode } from 'react';
import { ROUTES } from '../../app/router/routes';

export interface BottomNavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Inicio', path: ROUTES.home, icon: <HomeIcon /> },
  { label: 'Agregar paquete', path: ROUTES.scan, icon: <PhotoCameraIcon /> },
  { label: 'Mi ruta', path: ROUTES.routeSummary, icon: <RouteIcon /> },
  { label: 'Mapa', path: ROUTES.map, icon: <MapIcon /> },
];

export const HOME_ONLY_NAV_ITEMS: BottomNavItem[] = BOTTOM_NAV_ITEMS.filter((item) => item.path === ROUTES.home);
