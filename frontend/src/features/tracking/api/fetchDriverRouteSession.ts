import { authFetch } from '../../auth';
import type { RouteSession } from '../../route';

export interface DriverRouteSession {
  driver: { id: string; name: string; role: string };
  session: RouteSession | null;
}
const API_URL = import.meta.env.VITE_API_URL ?? '';
console.log('API_URL:', API_URL);
export async function fetchDriverRouteSession(driverName: string): Promise<DriverRouteSession> {
  const response = await authFetch(`${API_URL}/api/admin/drivers/${encodeURIComponent(driverName)}/route-session`);

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'No se pudo obtener la ruta del chofer.');
  }

  return (await response.json()) as DriverRouteSession;
}
