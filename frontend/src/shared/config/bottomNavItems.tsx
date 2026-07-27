import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import RouteIcon from '@mui/icons-material/Route';
import type { ReactNode } from 'react';
import { buildTrackingHistoryPath, buildTrackingMapPath, ROUTES } from '../../app/router/routes';

export interface BottomNavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

// "Agregar paquete" (escanear) no tiene acceso directo acá a propósito: solo se llega desde la
// card de Inicio o desde el "+" en la lista de entregas — ver HomePage.tsx/RouteSummaryPage.tsx.
export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Inicio', path: ROUTES.home, icon: <HomeIcon /> },
  { label: 'Mi ruta', path: ROUTES.routeSummary, icon: <RouteIcon /> },
  { label: 'Mapa', path: ROUTES.map, icon: <MapIcon /> },
];

export const HOME_ONLY_NAV_ITEMS: BottomNavItem[] = BOTTOM_NAV_ITEMS.filter((item) => item.path === ROUTES.home);

/**
 * Nav del admin mientras mira el seguimiento de un chofer puntual: "Inicio" vuelve al panel,
 * "Mapa" muestra las entregas de ESE chofer como pines, "Historial" el histórico de rutas ya
 * terminadas — nunca "Mi ruta" (el admin no reparte).
 */
export function getDriverTrackingNavItems(driverId: string): BottomNavItem[] {
  return [
    { label: 'Inicio', path: ROUTES.home, icon: <HomeIcon /> },
    { label: 'Mapa', path: buildTrackingMapPath(driverId), icon: <MapIcon /> },
    { label: 'Historial', path: buildTrackingHistoryPath(driverId), icon: <HistoryIcon /> },
  ];
}
