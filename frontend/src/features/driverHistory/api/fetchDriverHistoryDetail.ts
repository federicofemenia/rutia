import { authFetch } from '../../auth';
import type { Delivery } from '../../route';
import type { DriverHistoryDetail } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '';

interface RawDriverHistoryDetail {
  id: string;
  finishedAt: string;
  session: { deliveries: Delivery[] };
}

/** Sin `driverId`: el propio historial del chofer autenticado. Con `driverId`: vista de admin sobre ese chofer. */
export async function fetchDriverHistoryDetail(id: string, driverId?: string): Promise<DriverHistoryDetail> {
  const url = driverId
    ? `${API_URL}/api/admin/drivers/${encodeURIComponent(driverId)}/history/${encodeURIComponent(id)}`
    : `${API_URL}/api/driver/history/${encodeURIComponent(id)}`;
  const response = await authFetch(url);

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'No se pudo obtener el detalle de la ruta.');
  }

  const raw = (await response.json()) as RawDriverHistoryDetail;
  return { id: raw.id, finishedAt: raw.finishedAt, deliveries: raw.session.deliveries };
}
