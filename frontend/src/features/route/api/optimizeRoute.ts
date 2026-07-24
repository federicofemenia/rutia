import { authFetch } from '../../auth';
import type { Coordinates, Delivery, DeliveryAddress, OptimizeRouteSummary } from '../types';

export interface OptimizeRouteParams {
  deliveries: Delivery[];
  start: Coordinates;
  end: Coordinates | { address: DeliveryAddress };
}

export interface OptimizeRouteStats {
  verified: number;
  ambiguous: number;
  notFound: number;
  error: number;
}

export interface OptimizeRouteResult {
  deliveries: Delivery[];
  stats: OptimizeRouteStats;
  /** Ausente cuando no hubo ninguna entrega verificada para rutear. */
  route?: OptimizeRouteSummary;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';
export async function optimizeRoute({ deliveries, start, end }: OptimizeRouteParams): Promise<OptimizeRouteResult> {
  const response = await authFetch(`${API_URL}/api/routes/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deliveries,
      start,
      ...('address' in end ? { endAddress: end.address } : { end }),
    }),
  });

  if (!response.ok) {
    throw new Error('No se pudo optimizar la ruta.');
  }

  return (await response.json()) as OptimizeRouteResult;
}
