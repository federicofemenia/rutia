import { authFetch } from '../../auth';
import type { RouteSession } from '../../route';

/**
 * Empuja la RouteSession actual al backend (asociada al usuario autenticado vía el token). Es
 * un espejo para que el admin pueda hacer seguimiento — la fuente de verdad para el chofer
 * sigue siendo local (localStorage); si esto falla, no debe romper el uso normal de la app.
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
