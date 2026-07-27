import { authFetch } from '../../auth';
import type { RouteSession } from '../../route';
import { parseFinishRouteSessionResponse, parseRouteSessionResponse } from '../utils/parseRouteSessionResponse';

/**
 * El backend (`GET`/`PUT /api/route-session`, scopeado por el usuario autenticado vía el token)
 * es la única fuente de verdad de la RouteSession — `pushRouteSession` la sincroniza en cada
 * cambio, `fetchRouteSession` la hidrata al iniciar sesión. Nunca se persiste en `localStorage`.
 */

const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function pushRouteSession(session: RouteSession): Promise<void> {
  const response = await authFetch(`${API_URL}/api/route-session`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    throw new Error(`No se pudo sincronizar la ruta con el servidor (status ${response.status}).`);
  }
}

export async function fetchRouteSession(): Promise<RouteSession | null> {
  const response = await authFetch(`${API_URL}/api/route-session`);
  return parseRouteSessionResponse(response);
}

/** El backend revalida server-side que no queden entregas sin resolver antes de finalizar. */
export async function finishRouteSession(): Promise<RouteSession> {
  const response = await authFetch(`${API_URL}/api/route-session/finish`, { method: 'POST' });
  return parseFinishRouteSessionResponse(response);
}
