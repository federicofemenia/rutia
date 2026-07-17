import type { Request, Response } from 'express';
import type { OptimizeRoute } from '../../application/OptimizeRoute.js';
import type { Coordinates } from '../../domain/Coordinates.js';
import type { Delivery } from '../../domain/Delivery.js';
import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';

function isCoordinates(value: unknown): value is Coordinates {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Coordinates).latitude === 'number' &&
    typeof (value as Coordinates).longitude === 'number'
  );
}

function isDeliveryAddress(value: unknown): value is DeliveryAddress {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const address = value as DeliveryAddress;
  return (
    typeof address.street === 'string' &&
    typeof address.locality === 'string' &&
    typeof address.province === 'string' &&
    typeof address.country === 'string'
  );
}

export function createOptimizeRouteController(useCase: OptimizeRoute) {
  return async function optimizeRouteController(req: Request, res: Response) {
    const { deliveries, start, end, endAddress } = req.body as {
      deliveries?: unknown;
      start?: unknown;
      end?: unknown;
      endAddress?: unknown;
    };

    if (!Array.isArray(deliveries) || deliveries.length === 0) {
      res.status(400).json({ error: 'El campo "deliveries" es requerido y no puede estar vacío.' });
      return;
    }

    if (!isCoordinates(start)) {
      res.status(400).json({ error: 'El campo "start" es requerido y debe tener latitude/longitude.' });
      return;
    }

    if (!isCoordinates(end) && !isDeliveryAddress(endAddress)) {
      res.status(400).json({ error: 'Se requiere "end" (coordenadas) o "endAddress" (dirección estructurada).' });
      return;
    }

    try {
      const result = await useCase.execute({
        deliveries: deliveries as Delivery[],
        start,
        end: isCoordinates(end) ? end : { address: endAddress as DeliveryAddress },
      });
      res.status(200).json(result);
    } catch (error) {
      console.error('Error al optimizar la ruta', error);
      res.status(502).json({ error: 'No se pudo optimizar la ruta.' });
    }
  };
}
