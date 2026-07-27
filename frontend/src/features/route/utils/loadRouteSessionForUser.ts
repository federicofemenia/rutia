import { createRouteSession } from '../context/routeReducer';
import type { RouteSession } from '../types';

export interface RouteSessionLoader {
  fetchRouteSession: () => Promise<RouteSession | null>;
}

/**
 * Sesión inicial para un usuario recién autenticado: la del backend si existe, o una vacía si no
 * (sin ruta guardada) o si la carga falla (se prioriza no bloquear al chofer sobre reintentar —
 * puede seguir escaneando, y el próximo `pushRouteSession` la va a persistir igual).
 */
export async function loadRouteSessionForUser(loader: RouteSessionLoader): Promise<RouteSession> {
  try {
    const remote = await loader.fetchRouteSession();
    return remote ?? createRouteSession();
  } catch (error) {
    console.error('No se pudo cargar la ruta del usuario', error);
    return createRouteSession();
  }
}
