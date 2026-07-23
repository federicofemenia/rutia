import type { Request, Response } from 'express';
import type { GeocodeDeliveryAddress } from '../../application/GeocodeDeliveryAddress.js';
import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';

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

export function createGeocodeDeliveryAddressController(useCase: GeocodeDeliveryAddress) {
  return async function geocodeDeliveryAddressController(req: Request, res: Response) {
    const { address } = req.body as { address?: unknown };

    if (!isDeliveryAddress(address)) {
      res.status(400).json({ error: 'El campo "address" es requerido y debe tener street/locality/province/country.' });
      return;
    }

    try {
      const resolution = await useCase.execute(address);
      res.status(200).json(resolution);
    } catch (error) {
      console.error('Error al reintentar la geocodificación', error);
      res.status(502).json({ error: 'No se pudo geocodificar la dirección.' });
    }
  };
}
