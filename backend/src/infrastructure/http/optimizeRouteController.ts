import type { Request, Response } from 'express';
import type { OptimizeRoute } from '../../application/OptimizeRoute.js';
import type { Coordinates } from '../../domain/Coordinates.js';
import type { Delivery } from '../../domain/Delivery.js';

function isCoordinates(value: unknown): value is Coordinates {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Coordinates).latitude === 'number' &&
    typeof (value as Coordinates).longitude === 'number'
  );
}

export function createOptimizeRouteController(useCase: OptimizeRoute) {
  return async function optimizeRouteController(req: Request, res: Response) {
    const { deliveries, start, end } = req.body as {
      deliveries?: unknown;
      start?: unknown;
      end?: unknown;
    };

    if (!Array.isArray(deliveries) || deliveries.length === 0) {
      res.status(400).json({ error: 'El campo "deliveries" es requerido y no puede estar vacío.' });
      return;
    }

    if (!isCoordinates(start)) {
      res.status(400).json({ error: 'El campo "start" es requerido y debe tener latitude/longitude.' });
      return;
    }

    if (!isCoordinates(end)) {
      res.status(400).json({ error: 'El campo "end" es requerido y debe tener latitude/longitude.' });
      return;
    }

    try {
      const result = await useCase.execute({
        deliveries: deliveries as Delivery[],
        start,
        end,
      });
      res.status(200).json(result);
    } catch (error) {
      console.error('Error al optimizar la ruta', error);
      res.status(502).json({ error: 'No se pudo optimizar la ruta.' });
    }
  };
}
