import HistoryIcon from '@mui/icons-material/History';
import { createElement, useMemo } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import type { AppMenuItem } from '../components';

/**
 * Función pura (separada del hook) para poder testear el armado del menú inyectando un
 * `navigate` fake, sin depender de React Router en el test. Usa `createElement` en vez de JSX
 * a propósito: el runner de tests (`tsx --test`) no resuelve el pragma JSX de este archivo por
 * fuera de un bundler, y `createElement` es equivalente sin depender de esa transformación.
 */
export function buildDriverMenuItems(navigate: NavigateFunction): AppMenuItem[] {
  return [
    {
      key: 'my-deliveries',
      label: 'Mis entregas',
      icon: createElement(HistoryIcon, { fontSize: 'small' }),
      onSelect: () => navigate(ROUTES.driverHistory),
    },
  ];
}

/** Opciones del menú hamburguesa para el rol DRIVER. Agregar una opción nueva (Perfil, Ayuda, ...) es un elemento más acá. */
export function useDriverMenuItems(): AppMenuItem[] {
  const navigate = useNavigate();
  return useMemo(() => buildDriverMenuItems(navigate), [navigate]);
}
