import type { Request, Response } from 'express';
import type { GetDriverRouteSession } from '../../application/GetDriverRouteSession.js';

export function createGetDriverRouteSessionController(useCase: GetDriverRouteSession) {
  return async function getDriverRouteSessionController(req: Request, res: Response) {
    const { name } = req.params;

    if (typeof name !== 'string' || name.length === 0) {
      res.status(400).json({ error: 'Falta el nombre del chofer.' });
      return;
    }

    try {
      const result = await useCase.execute(name);

      if (!result) {
        res.status(404).json({ error: `No se encontró un chofer con el nombre "${name}".` });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error al obtener la ruta del chofer', error);
      res.status(500).json({ error: 'No se pudo obtener la ruta del chofer.' });
    }
  };
}
