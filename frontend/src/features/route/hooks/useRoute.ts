import { useContext } from 'react';
import { RouteContext } from '../context/routeContextObject';

export function useRoute() {
  const context = useContext(RouteContext);

  if (!context) {
    throw new Error('useRoute debe usarse dentro de RouteProvider');
  }

  return context;
}
