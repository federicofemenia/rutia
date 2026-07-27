import { authFetch } from '../../auth';
import type { DriverHistorySummary } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function fetchDriverHistory(): Promise<DriverHistorySummary[]> {
  const response = await authFetch(`${API_URL}/api/driver/history`);

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'No se pudo obtener el histórico de entregas.');
  }

  const data = (await response.json()) as { history: DriverHistorySummary[] };
  return data.history;
}
