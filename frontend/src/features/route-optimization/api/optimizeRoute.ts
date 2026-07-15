import type { Coordinates, Delivery } from '../../route';

export interface OptimizeRouteParams {
  deliveries: Delivery[];
  start: Coordinates;
  end: Coordinates | { address: string };
}

export async function optimizeRoute({ deliveries, start, end }: OptimizeRouteParams): Promise<Delivery[]> {
  const response = await fetch('/api/routes/optimize', {
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

  const data = (await response.json()) as { deliveries: Delivery[] };
  return data.deliveries;
}
