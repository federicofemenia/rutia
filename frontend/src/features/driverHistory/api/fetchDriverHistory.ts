import { authFetch } from '../../auth';
import type { DriverHistorySummary } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** Sin `driverId`: el propio historial del chofer autenticado. Con `driverId`: vista de admin sobre ese chofer. */
export async function fetchDriverHistory(driverId?: string): Promise<DriverHistorySummary[]> {
  const url = driverId
    ? `${API_URL}/api/admin/drivers/${encodeURIComponent(driverId)}/history`
    : `${API_URL}/api/driver/history`;
  const response = await authFetch(url);

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'No se pudo obtener el histórico de entregas.');
  }

  const data = (await response.json()) as { history: DriverHistorySummary[] };
  return data.history;
}
